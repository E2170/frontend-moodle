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
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye zaman aşımı

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.errorcode === "invalidtoken") {
      window.dispatchEvent(new Event("moodle_token_expired"));
      throw new Error("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("API isteği zaman aşımına uğradı. Sunucu yanıt vermiyor.");
    }
    throw error;
  }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

export const moodlePost = async (token, wsfunction, extraParams = {}, useCache = true) => {
  const cacheKey = `moodle_cache_${token}_${wsfunction}_${JSON.stringify(extraParams)}`;
  
  // Sadece "get" veya listeleme işlevleri (veritabanını değiştirmeyenler) için cache uygulanır
  const isReadOnly = wsfunction.includes('_get_') || wsfunction.includes('core_calendar_') || wsfunction.includes('mod_forum_');

  if (useCache && isReadOnly) {
    try {
      const cachedItem = sessionStorage.getItem(cacheKey);
      if (cachedItem) {
        const parsed = JSON.parse(cachedItem);
        // Cache süresi dolmadıysa önbellekten (sessionStorage) anında döndür
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn("Cache okuma hatası", e);
    }
  }

  // Eğer önbellekte yoksa veya süresi dolduysa ağ isteği yap
  const data = await doMoodlePost(token, wsfunction, extraParams);
  
  if (useCache && isReadOnly && data && !data.errorcode) {
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) {
      console.warn("Cache yazma hatası", e);
    }
  }

  return data;
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

export const extractCourseImage = (course, token) => {
  let url = null;
  if (course.overviewfiles && course.overviewfiles.length > 0) {
    const imgFile = course.overviewfiles.find(f => 
        f.filename && /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename)
    ) || course.overviewfiles[0];
    url = imgFile?.fileurl;
  }
  
  if (!url && course.courseimage) {
    url = course.courseimage;
  }

  if (url) {
    if (url.includes("/pluginfile.php/") && !url.includes("/webservice/pluginfile.php/")) {
      url = url.replace("/pluginfile.php/", "/webservice/pluginfile.php/");
    }
    if (url.includes("pluginfile.php") && !url.includes("token=")) {
      url = url + (url.includes("?") ? "&" : "?") + "token=" + token;
    }
  }
  
  return url;
};
