/**
 * TorrentClaw 片单原型 v1.0 — 只显示片单，不接播放
 * 用途: TVMax / FongMi TV 的 drpy 站点规则 (type 3, api=drpy2.min.js)
 * 数据源: https://torrentclaw.com/api/v1/* (匿名访问, 无需 API Key)
 *   - /api/v1/popular  热门 (limit 1-24)
 *   - /api/v1/recent   最新 (limit 1-24)
 *   - /api/v1/trending 趋势 daily/weekly (limit 1-50)
 *   - /api/v1/upcoming 即将上映 (limit 1-50)
 *   - /api/v1/search   搜索 / 发现 (q 或 type+min_rating 等, limit 1-50)
 * 实测 (2026-11-21):
 *   - 匿名返回只有 TMDB 元数据: 标题/年份/海报/评分/简介/类型,
 *     不含 magnetUrl / infoHash / torrentUrl, 所以本原型天生播不了,
 *     详情页也不设任何播放线路.
 *   - 匿名限流约 10 次/窗口, 429 会带 Retry-After; 翻页不要太快.
 *   - 电视是 Android 5.1, 部分 HTTPS 链可能握手失败, 若 TVMax 里空白,
 *     先在手机/电脑浏览器打开 https://torrentclaw.com/api/v1/popular?limit=3
 *     验证接口本身是否通, 再排查电视 TLS.
 * 不改主配置: 只加下面一个站点, 不要覆盖 tvmax-config.json 全量.
 */

var rule = {
    title: 'TorrentClaw片单',
    host: 'https://torrentclaw.com',
    homeUrl: '/api/v1/popular?limit=24&page=1',
    url: '/api/v1/popular?limit=24&page=fypage',
    detailUrl: 'fyid',
    searchUrl: '/api/v1/search?q=**&limit=24&page=fypage',
    searchable: 1,
    quickSearch: 1,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; BAOFENG_TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'application/json'
    },
    timeout: 15000,
    limit: 12,
    play_parse: false,
    lazy: '',
    class_name: '热门&最新&趋势·日&趋势·周&即将上映&高分电影&高分剧集',
    class_url: 'popular&recent&trending_daily&trending_weekly&upcoming&movie_top&show_top',

    推荐: `js:
var d = [];
try {
    var html = request(input);
    var j = JSON.parse(html);
    var arr = j.items || j.results || [];
    arr.forEach(function(it) {
        var desc = (it.year || '') + '';
        if (it.rating) desc += (desc ? ' · ' : '') + it.rating + '分';
        if (it.contentType) desc += (desc ? ' · ' : '') + (it.contentType === 'show' ? '剧集' : '电影');
        if (it.maxSeeders) desc += ' · 做种' + it.maxSeeders;
        if (it.genres && it.genres.length) desc += ' · ' + it.genres.slice(0, 3).join('/');
        d.push({
            title: it.title || '',
            img: it.posterUrl || '',
            desc: desc,
            url: encodeURIComponent(it.title || '') + '|' + (it.year || '') + '|' + (it.tmdbId || '')
        });
    });
} catch (e) {
    log('TorrentClaw推荐失败:' + e.message);
}
setResult(d);
`,

    一级: `js:
var tid = 'popular';
try {
    if (typeof cateObj !== 'undefined' && cateObj.tid) tid = String(cateObj.tid);
    else if (typeof MY_CATE !== 'undefined' && MY_CATE) tid = String(MY_CATE);
} catch (e) {}
var pg = 1;
try { if (typeof MY_PAGE !== 'undefined' && MY_PAGE) pg = MY_PAGE; } catch (e) {}
var api = '/api/v1/popular?limit=24&page=' + pg;
if (tid === 'recent') api = '/api/v1/recent?limit=24&page=' + pg;
else if (tid === 'trending_daily') api = '/api/v1/trending?period=daily&limit=24&page=' + pg;
else if (tid === 'trending_weekly') api = '/api/v1/trending?period=weekly&limit=24&page=' + pg;
else if (tid === 'upcoming') api = '/api/v1/upcoming?limit=24&page=' + pg + '&type=all';
else if (tid === 'movie_top') api = '/api/v1/search?type=movie&min_rating=7&limit=24&page=' + pg;
else if (tid === 'show_top') api = '/api/v1/search?type=show&min_rating=7&limit=24&page=' + pg;
var d = [];
try {
    var html = request(HOST + api);
    var j = JSON.parse(html);
    var arr = j.items || j.results || [];
    arr.forEach(function(it) {
        var desc = (it.year || '') + '';
        if (it.rating) desc += (desc ? ' · ' : '') + it.rating + '分';
        if (it.contentType) desc += (desc ? ' · ' : '') + (it.contentType === 'show' ? '剧集' : '电影');
        if (it.maxSeeders) desc += ' · 做种' + it.maxSeeders;
        if (it.genres && it.genres.length) desc += ' · ' + it.genres.slice(0, 3).join('/');
        d.push({
            title: it.title || '',
            img: it.posterUrl || '',
            desc: desc,
            url: encodeURIComponent(it.title || '') + '|' + (it.year || '') + '|' + (it.tmdbId || '')
        });
    });
} catch (e) {
    log('TorrentClaw一级失败:' + e.message);
}
setResult(d);
`,

    二级: `js:
var title = '', year = '', tmdbId = '';
try {
    var parts = String(input).split('|');
    title = decodeURIComponent(parts[0] || '');
    year = parts[1] || '';
    tmdbId = parts[2] || '';
} catch (e) {}
var node = null;
try {
    var url = '';
    if (tmdbId) url = HOST + '/api/v1/search?tmdbid=' + tmdbId + '&limit=1';
    else if (title) url = HOST + '/api/v1/search?q=' + encodeURIComponent(title) + '&limit=5';
    if (url) {
        var html = request(url);
        var j = JSON.parse(html);
        var arr = j.results || [];
        if (arr.length) {
            node = arr[0];
            if (year) {
                for (var i = 0; i < arr.length; i++) {
                    if (String(arr[i].year) === String(year)) { node = arr[i]; break; }
                }
            }
        }
    }
} catch (e) {
    log('TorrentClaw详情失败:' + e.message);
}
if (!node) {
    node = { title: title, year: year, posterUrl: '', overview: '未取到详情, 请返回重试。', genres: [], rating: '' };
}
var content = (node.overview || '暂无简介。');
content += '\\n\\n[原型] 只显示片单, 不提供播放 / 下载。想看请走你自己的合法片源。';
if (node.genres && node.genres.length) content += '\\n类型: ' + node.genres.join(' / ');
if (node.contentType) content += '\\n类别: ' + (node.contentType === 'show' ? '剧集' : '电影');
VOD = {
    vod_id: input,
    vod_name: node.title || title,
    vod_pic: node.posterUrl || '',
    type_name: (node.genres && node.genres.length) ? node.genres[0] : '',
    vod_year: node.year || year,
    vod_remarks: node.rating ? node.rating + '分' : '',
    vod_content: content
};
`,

    搜索: `js:
var d = [];
try {
    var html = request(input);
    var j = JSON.parse(html);
    var arr = j.results || j.items || [];
    arr.forEach(function(it) {
        var desc = (it.year || '') + '';
        if (it.rating) desc += (desc ? ' · ' : '') + it.rating + '分';
        if (it.contentType) desc += (desc ? ' · ' : '') + (it.contentType === 'show' ? '剧集' : '电影');
        if (it.maxSeeders) desc += ' · 做种' + it.maxSeeders;
        if (it.genres && it.genres.length) desc += ' · ' + it.genres.slice(0, 3).join('/');
        d.push({
            title: it.title || '',
            img: it.posterUrl || '',
            desc: desc,
            url: encodeURIComponent(it.title || '') + '|' + (it.year || '') + '|' + (it.tmdbId || '')
        });
    });
} catch (e) {
    log('TorrentClaw搜索失败:' + e.message);
}
setResult(d);
`
};
