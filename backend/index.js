const express = require("express");
const neo4j = require("neo4j-driver");
const cors = require("cors");
const axios = require("axios");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const dbUrl = process.env.DB_URI || "neo4j://localhost:7687";
const dbUser = process.env.DB_USER || "neo4j";
const dbPassword = process.env.DB_PASSWORD || "password123";

const driver = neo4j.driver(
  dbUrl,
  neo4j.auth.basic(dbUser, dbPassword),
);

app.get("/graph", async (req, res) => {
  const session = driver.session();
  try {
    // Return only Users for the list
    const result = await session.run(`
            MATCH (n:User) 
            RETURN n.name as name, n.role as role, labels(n) as labels, id(n) as id
        `);

    const nodes = result.records.map((r) => ({
      id: r.get("id").toNumber(),
      name: r.get("name"),
      label: "User",
      role: r.get("role"),
    }));

    res.json({ nodes });
  } catch (e) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    await session.close();
  }
});

// 2. Get User Permissions (The Core Logic)
app.get("/permissions/:user", async (req, res) => {
  const session = driver.session();
  const { user } = req.params;
  console.log(`🔎 Checking permissions for: ${user}`); // Log request

  try {
    // Find path: User -> Group -> Resource
    const query = `
            MATCH (u:User {name: $user})-[:MEMBER_OF]->(g:Group)-[r]->(resource)
            RETURN 
                resource.name as resource, 
                resource.sensitivity as sensitivity,
                type(r) as permission,
                g.name as via_group
        `;

    const result = await session.run(query, { user });

    const permissions = result.records.map((record) => ({
      resource: record.get("resource"),
      sensitivity: record.get("sensitivity"),
      permission: record.get("permission"),
      via: record.get("via_group"),
    }));

    console.log(`   Found ${permissions.length} permissions.`); // Log result
    res.json(permissions);
  } catch (e) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    await session.close();
  }
});

// ROUTE: Sync Real Data with TIERS (Admins vs Contributors)
app.post("/sync/github", async (req, res) => {
  const session = driver.session();
  const { owner, repo } = req.body;
  console.log(`🔄 Syncing with GitHub repo: ${owner}/${repo}...`);

  try {
    const ghRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=30`,
    ); // Fetch top 30
    const contributors = ghRes.data;

    // 1. Clear Old Data
    await session.run("MATCH (n) DETACH DELETE n");

    // 2. Create Repository Node
    await session.run(
      `
            CREATE (r:Server {name: $repoName, sensitivity: "PUBLIC", type: "Repository"})
        `,
      { repoName: `${owner}/${repo}` },
    );

    // 3. Create GROUPS (The Tiers)
    await session.run(
      `CREATE (gAdmin:Group {name: "Maintainers", type: "GitHub Admin"})`,
    );
    await session.run(
      `CREATE (gDev:Group {name: "Contributors", type: "GitHub Dev"})`,
    );

    // 4. Assign Permissions
    // Maintainers can DELETE (High Risk)
    await session.run(
      `
            MATCH (g:Group {name: "Maintainers"}), (r:Server {name: $repoName})
            CREATE (g)-[:CAN_DELETE]->(r)
        `,
      { repoName: `${owner}/${repo}` },
    );

    // Contributors can only WRITE
    await session.run(
      `
            MATCH (g:Group {name: "Contributors"}), (r:Server {name: $repoName})
            CREATE (g)-[:CAN_WRITE]->(r)
        `,
      { repoName: `${owner}/${repo}` },
    );

    // 5. Sort Users into Groups based on "Contributions" count
    for (const user of contributors) {
      const role = user.contributions > 500 ? "Maintainer" : "Contributor";
      const groupName =
        user.contributions > 500 ? "Maintainers" : "Contributors";

      await session.run(
        `
                MATCH (g:Group {name: $groupName})
                CREATE (u:User {name: $login, role: $role, contributions: $count})
                CREATE (u)-[:MEMBER_OF]->(g)
            `,
        {
          login: user.login,
          role: role,
          groupName: groupName,
          count: user.contributions,
        },
      );
    }

    res.json({
      message: `Synced ${contributors.length} users. Separated into Admins & Contributors.`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(e.message);
  } finally {
    await session.close();
  }
});

app.listen(3000, () =>
  console.log("🚀 AccessGuard Backend running on port 3000"),
);
