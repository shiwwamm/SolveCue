const marker = document.createElement("meta");
marker.name = "solvecue-content-script";
marker.content = "active";
document.head.appendChild(marker);

console.info("[SolveCue] Content script active on", window.location.pathname);
