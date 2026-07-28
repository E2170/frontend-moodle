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

export const fetchUserAnnouncements = async (token, userid) => {
  try {
    const courses = await moodlePost(token, "core_enrol_get_users_courses", { userid });
    if (!courses || !courses.length) return [];
    
    const params = {};
    courses.forEach((c, i) => {
      params[`courseids[${i}]`] = c.id;
    });
    
    const forums = await moodlePost(token, "mod_forum_get_forums_by_courses", params);
    if (!forums || !forums.length) return [];
    
    const newsForums = forums.filter(f => f.type === 'news');
    if (!newsForums.length) return [];
    
    const discussionsPromises = newsForums.map(f => 
      moodlePost(token, "mod_forum_get_forum_discussions", { forumid: f.id }).catch(() => null)
    );
    
    const results = await Promise.all(discussionsPromises);
    let allDiscussions = [];
    results.forEach(res => {
      if (res && res.discussions) {
        allDiscussions = [...allDiscussions, ...res.discussions];
      }
    });
    
    allDiscussions.sort((a, b) => b.timemodified - a.timemodified);
    return allDiscussions;
  } catch (e) {
    console.error("Error fetching announcements:", e);
    return [];
  }
};
