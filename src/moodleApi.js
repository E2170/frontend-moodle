// Merkezi Moodle API İstek Yöneticisi
// Tüm `moodlePost` çağrıları bu dosya üzerinden yönetilerek, "Oturum Süresi Doldu" gibi durumlar merkezi olarak kontrol edilir.

const doMoodlePost = async (token, wsfunction, extraParams = {}) => {
  const params = new URLSearchParams({
    wstoken: token,
    wsfunction: wsfunction,
    moodlewsrestformat: "json",
    ...extraParams
  });

  const endpoint = import.meta.env.VITE_REST_ENDPOINT || "/api/webservice/rest/server.php";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (data && data.errorcode === "invalidtoken") {
    window.dispatchEvent(new Event("moodle_token_expired"));
    throw new Error("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
  }

  return data;
};

export const moodlePost = async (token, wsfunction, extraParams = {}) => {
  return await doMoodlePost(token, wsfunction, extraParams);
};
