import React from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const GraphCanvas = ({ 
  graphRef, 
  graphData, 
  onNodeClick, 
  impactReport, 
  auditResult, 
  selectedNode, 
  isHealing, 
  viewMode 
}) => {

  return (
    <ForceGraph2D
        key={graphData.nodes.length} // Force re-render on data load
        ref={graphRef}
        graphData={graphData}
        backgroundColor="#030712"
        width={window.innerWidth}
        height={window.innerHeight}
        
        // --- PHYSICS SETTINGS ---
        // Increase repulsion so nodes don't bunch up
        d3Force={('charge', (force) => force.strength(-120))} 
        
        // --- VISUAL LOGIC ---
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.realName || node.name || node.id;
          
          // 1. Is it Impacted? (Ops Mode)
          const isImpacted = impactReport?.services.some(s => s.name === label);
          
          // 2. Is it Compromised? (Security Mode)
          const isCompromised = auditResult?.compromised_nodes.includes(label);
          
          const isSelected = selectedNode?.id === node.id;

          // COLORS
          let color = "#ffffff"; // Default White
          
          // Priority 1: Security Highlighting (Purple)
          if (viewMode === 'SEC' && isCompromised) color = "#c026d3"; 
          // Priority 2: Healing (Green)
          else if (isHealing && isImpacted) color = "#4ade80"; 
          // Priority 3: Impact/Broken (Red)
          else if (isImpacted) color = "#ef4444"; 
          
          // Priority 4: Default Role Colors
          else if (node.label === "Server") color = "#3b82f6";    // Blue
          else if (node.label === "Database") color = "#eab308";  // Yellow
          else if (node.label === "App") color = "#10b981";       // Green
          else if (node.label === "User") color = "#f472b6";      // Pink
          else if (node.label === "Group") color = "#a78bfa";     // Violet

          // DRAW CIRCLE
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.beginPath();
          ctx.fillStyle = color;
          
          // Size based on importance
          let r = 5;
          if (node.label === 'Server') r = 10;
          if (node.label === 'User') r = 4;
          if (isSelected) r = 12;

          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fill();

          // DRAW GLOW (If Active)
          if (isImpacted || (viewMode === 'SEC' && isCompromised) || isSelected) {
            ctx.beginPath();
            
            // Glow Color
            let glowColor = "rgba(255, 255, 255, 0.3)";
            if (isHealing) glowColor = "rgba(74, 222, 128, 0.6)";
            else if (viewMode === 'SEC' && isCompromised) glowColor = "rgba(192, 38, 211, 0.6)";
            else if (isImpacted) glowColor = "rgba(239, 68, 68, 0.6)";

            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 2 / globalScale;
            ctx.arc(node.x, node.y, r * 2, 0, 2 * Math.PI, false);
            ctx.stroke();
          }

          // TEXT LABEL
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // If healing or compromised, make text match the color. Otherwise faint white.
          ctx.fillStyle = (isHealing || isCompromised || isImpacted) ? color : 'rgba(255, 255, 255, 0.6)';
          
          // Only show label if selected, important, or hovered (optimization)
          if (globalScale > 1.5 || isSelected || isImpacted || isCompromised) {
             ctx.fillText(label, node.x, node.y + (r + 6));
          }
        }}

        // --- LINKS & PARTICLES ---
        linkColor={(link) => {
            // If viewing security, and this link is part of the attack path, color it Purple
            if (viewMode === 'SEC' && auditResult?.attack_vectors) {
                const isAttackPath = auditResult.attack_vectors.some(
                    v => (v.source === link.source.realName && v.target === link.target.realName)
                );
                if (isAttackPath) return "#c026d3";
            }
            return "#1f2937"; // Default Dark Gray
        }}
        
        linkWidth={link => {
            // Thicker lines for attack paths
            if (viewMode === 'SEC' && auditResult?.attack_vectors) {
                 const isAttackPath = auditResult.attack_vectors.some(
                    v => (v.source === link.source.realName && v.target === link.target.realName)
                );
                if (isAttackPath) return 3;
            }
            return 1;
        }}

        // Particles
        linkDirectionalParticles={link => {
             // Ops Impact Particles
             const isImpactedLink = impactReport?.services.some(s => s.name === link.source.realName) && 
                                    impactReport?.services.some(s => s.name === link.target.realName);
             
             // Security Attack Particles
             let isAttackPath = false;
             if (viewMode === 'SEC' && auditResult?.attack_vectors) {
                isAttackPath = auditResult.attack_vectors.some(
                    v => (v.source === link.source.realName && v.target === link.target.realName)
                );
             }

             return (isImpactedLink || isAttackPath) ? 4 : 0;
        }}
        
        linkDirectionalParticleSpeed={link => isHealing ? 0.01 : -0.005}
        linkDirectionalParticleWidth={4}
        linkDirectionalParticleColor={() => (isHealing ? "#4ade80" : (viewMode === 'SEC' ? "#c026d3" : "#ef4444"))}
        
        onNodeClick={onNodeClick}
      />
  );
};

export default GraphCanvas;
