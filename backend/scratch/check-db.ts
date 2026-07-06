async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/news/top-stories?limit=8");
    const json = await res.json();
    console.log("Returned top-stories count:", json.data.articles.length);
    json.data.articles.forEach((art: any, idx: number) => {
      console.log(`${idx + 1}: ID=${art.id} Category=${art.category} TitleGu="${art.titleGu}"`);
    });
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

main();
