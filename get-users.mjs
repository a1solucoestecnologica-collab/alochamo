import fetch from "node-fetch";

const response = await fetch("http://localhost:3000/api/trpc/auth.me");
console.log("Status:", response.status);
const data = await response.json();
console.log("Data:", data);
