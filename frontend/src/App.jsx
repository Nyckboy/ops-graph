import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  ShieldAlert,
  Lock,
  CheckCircle,
  AlertTriangle,
  Users,
} from "lucide-react";

const App = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repoInput, setRepoInput] = useState("facebook/react");
  const [syncing, setSyncing] = useState(false);

  // 1. Fetch Users on Load
  useEffect(() => {
    // Simple query to get all users (You might need to add this route to backend or use the graph route and filter)
    // For now, let's hardcode the list or fetch from graph
    axios.get("http://localhost:3000/graph").then((res) => {
      const userNodes = res.data.nodes.filter((n) => n.label === "User");
      setUsers(userNodes);
    });
  }, []);

  // 2. Fetch Permissions when User Selected
  const selectUser = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/permissions/${user.name}`,
      );
      setPermissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const [owner, repo] = repoInput.split("/");
    try {
      await axios.post("http://localhost:3000/sync/github", { owner, repo });
      alert("Sync Complete! Refreshing data...");
      window.location.reload(); // Quick reload to fetch new data
    } catch (err) {
      alert("Sync failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Helper: Color code permissions
  const getPermColor = (perm) => {
    if (perm === "CAN_DELETE")
      return "bg-red-500/20 text-red-300 border-red-500/50";
    if (perm === "CAN_WRITE")
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
    return "bg-green-500/20 text-green-300 border-green-500/50";
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          AccessGuard IAM
        </h1>
        <p className="text-slate-400">Interactive Permission Auditor</p>
      </div>

      <div className="w-full max-w-5xl mb-8 flex gap-4 items-end bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex-1">
          <label className="text-xs text-slate-400 font-bold uppercase block mb-2">
            Sync Real GitHub Data
          </label>
          <input
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-slate-200"
            placeholder="owner/repo (e.g. facebook/react)"
          />
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition-all disabled:opacity-50"
        >
          {syncing ? "Fetching..." : "Import Real Users"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* LEFT: USER LIST */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users size={20} /> Select User
          </h2>
          <div className="space-y-3">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => selectUser(u)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${selectedUser === u ? "bg-blue-600/20 border-blue-500" : "bg-slate-900 border-slate-800 hover:border-slate-600"}`}
              >
                <div className="bg-slate-800 p-2 rounded-full">
                  <User size={18} className="text-slate-300" />
                </div>
                <div className="text-left">
                  <div className="font-bold">{u.name}</div>
                  <div className="text-xs text-slate-400">
                    {u.role || "Employee"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: PERMISSION SIMULATOR */}
        <div className="md:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700 relative">
          {!selectedUser ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
              <Lock size={48} className="mb-4" />
              <p>Select a user to audit permissions</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedUser.name}'s Access Profile
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Reviewing effective permissions via Group membership.
                  </p>
                </div>
                {permissions.some((p) => p.permission === "CAN_DELETE") && (
                  <div className="flex items-center gap-2 bg-red-900/30 text-red-400 px-3 py-1 rounded border border-red-900/50 text-sm font-bold animate-pulse">
                    <AlertTriangle size={16} /> HIGH RISK USER
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center py-10 text-slate-500">
                  Auditing...
                </div>
              ) : permissions.length === 0 ? (
                <div className="p-4 bg-green-900/20 text-green-400 rounded border border-green-900/50 text-center">
                  <CheckCircle className="inline mr-2" size={18} /> No sensitive
                  access found.
                </div>
              ) : (
                <div className="grid gap-3">
                  {permissions.map((p, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-center justify-between group hover:border-slate-600 transition-all"
                    >
                      {/* Resource Info */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-10 rounded-full ${p.sensitivity === "CRITICAL" ? "bg-red-500" : "bg-blue-500"}`}
                        ></div>
                        <div>
                          <div className="font-bold text-lg">{p.resource}</div>
                          <div className="text-xs text-slate-500">
                            Sensitivity: {p.sensitivity}
                          </div>
                        </div>
                      </div>

                      {/* Permission Badge */}
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded text-xs font-bold border ${getPermColor(p.permission)}`}
                        >
                          {p.permission}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">
                          via{" "}
                          <span className="text-slate-300 font-mono">
                            {p.via}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
