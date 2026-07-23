import { moodlePost } from './src/moodleApi.js';

(async () => {
    // You need to manually replace this with a valid student token and forum id
    const token = process.argv[2]; 
    const forumid = process.argv[3];
    
    try {
        console.log("Fetching for forum:", forumid);
        const res = await moodlePost(token, 'mod_forum_get_forum_discussions_paginated', {
            forumid: forumid,
            sortby: "timemodified",
            sortdirection: "DESC"
        });
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
})();
