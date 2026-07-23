const str = "[{\"playback\":\"<div id=\\\"playbacks-1\\\"></div>\",\"recording\":\"<span>test</span>\"}]";
try {
  const parsed = JSON.parse(str);
  console.log("Parsed:", parsed);
} catch (e) {
  console.log("Error:", e.message);
}
