/**
 * TorrentClaw 片单 v1.4 — 全中文片单 (locale=zh)
 * 用途: TVMax / FongMi TV 的 drpy 站点规则 (type 3, api=drpy2.min.js)
 * 数据源: https://torrentclaw.com/api/v1/* (匿名访问, 无需 API Key)
 * v1.4 (2026-11-22 01:26, 用户截图指出网站有语言设置):
 *   - 全部 Claw 接口加 locale=zh。网站语言设置就是 zh(截图 torrentclaw.com/zh),
 *     不是 zh-CN: 实测 locale=zh 返回中文名(奥德赛/蜘蛛人:重生日/八仙!),
 *     而 zh-CN / Accept-Language / lang / cookie 全部仍返回英文名。
 *     详情简介也随之变中文。无中文译名的少数片(Turbo)仍显示英文原名。
 * v1.3 (2026-11-22 00:41, 用户指令“点海报就去搜”):
 *   - 列表海报链接改走极简 fyid: 有 tmdbId 就只传数字, 没有就传 t+标题,
 *     不再用 § 内嵌长串, 可视版壳子再怎么处理也不会把详情链接搞坏,
 *     之前详情页整页“没找到数据”就是详情链接在可视版里失效。
 *   - 点开详情: 先取片名(有 tmdbId 就调 Claw 接口取, 没有就用标题),
 *     再把英文片名经豆瓣 suggest 换成中文片名(采集源只认中文名,
 *     英文名搜非凡直接 0 结果、搜量子全是无关项, 实测),
 *     然后去 4 个采集源(量子/非凡/暴风/ikun)的 CMS 接口搜中文名,
 *     有结果的源变成一条播放线路, 直接给 m3u8, 点线路就能播。
 *   - 采集源搜不到(比如太新的片)时详情也照常显示片名/海报/简介,
 *     用户再用壳子自带的搜索按中文名搜一次即可, 不再整页没数据。
 *   - 仍不接磁力/下载, 只给采集源的 m3u8 直链。
 */

var rule = {
    title: 'TorrentClaw片单',
    host: 'https://torrentclaw.com',
    homeUrl: '/api/v1/popular?limit=24&page=1&locale=zh',
    url: '/api/v1/popular?limit=24&page=fypage&locale=zh',
    detailUrl: 'fyid',
    searchUrl: '/api/v1/search?q=**&limit=24&page=fypage&locale=zh',
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
var __UA = 'Mozilla/5.0 (Linux; Android 5.1.1; BAOFENG_TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
var __H = {headers: {'User-Agent': __UA, 'Accept': 'application/json'}};
function slog(m) { try { log(m); } catch (e) {} }
function mkUrl(it) {
    if (it.tmdbId) return String(it.tmdbId);
    return 't' + encodeURIComponent(it.title || '');
}
var d = [];
try {
    var html = request(input, __H);
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
            url: mkUrl(it)
        });
    });
} catch (e) {
    slog('TorrentClaw推荐失败:' + e.message);
}
setResult(d);
`,

    一级: `js:
var __UA = 'Mozilla/5.0 (Linux; Android 5.1.1; BAOFENG_TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
var __H = {headers: {'User-Agent': __UA, 'Accept': 'application/json'}};
function slog(m) { try { log(m); } catch (e) {} }
function mkUrl(it) {
    if (it.tmdbId) return String(it.tmdbId);
    return 't' + encodeURIComponent(it.title || '');
}
var tid = 'popular';
try {
    if (typeof cateObj !== 'undefined' && cateObj.tid) tid = String(cateObj.tid);
    else if (typeof MY_CATE !== 'undefined' && MY_CATE) tid = String(MY_CATE);
} catch (e) {}
var pg = 1;
try { if (typeof MY_PAGE !== 'undefined' && MY_PAGE) pg = MY_PAGE; } catch (e) {}
var api = '/api/v1/popular?limit=24&page=' + pg + '&locale=zh';
if (tid === 'recent') api = '/api/v1/recent?limit=24&page=' + pg + '&locale=zh';
else if (tid === 'trending_daily') api = '/api/v1/trending?period=daily&limit=24&page=' + pg + '&locale=zh';
else if (tid === 'trending_weekly') api = '/api/v1/trending?period=weekly&limit=24&page=' + pg + '&locale=zh';
else if (tid === 'upcoming') api = '/api/v1/upcoming?limit=24&page=' + pg + '&type=all&locale=zh';
else if (tid === 'movie_top') api = '/api/v1/search?type=movie&min_rating=7&limit=24&page=' + pg + '&locale=zh';
else if (tid === 'show_top') api = '/api/v1/search?type=show&min_rating=7&limit=24&page=' + pg + '&locale=zh';
var d = [];
try {
    var html = request(HOST + api, __H);
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
            url: mkUrl(it)
        });
    });
} catch (e) {
    slog('TorrentClaw一级失败:' + e.message);
}
setResult(d);
`,

    二级: `js:
var __UA = 'Mozilla/5.0 (Linux; Android 5.1.1; BAOFENG_TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
var __H = {headers: {'User-Agent': __UA, 'Accept': 'application/json'}};
function slog(m) { try { log(m); } catch (e) {} }
function hasCJK(s) { return /[\\u4e00-\\u9fff]/.test(s || ''); }
function pickBest(list, title, year) {
    var best = null, bestScore = -1;
    for (var i = 0; i < list.length; i++) {
        var it = list[i] || {};
        var nm = String(it.vod_name || '');
        var sc = 0;
        if (nm === title) sc += 10;
        else if (nm.indexOf(title) >= 0 || title.indexOf(nm) >= 0) sc += 6;
        if (year && String(it.vod_year) === String(year)) sc += 5;
        if (sc > bestScore) { bestScore = sc; best = it; }
    }
    return bestScore > 0 ? best : null;
}
function pickM3u8(playFrom, playUrl) {
    var froms = String(playFrom || '').split('$$$');
    var urls = String(playUrl || '').split('$$$');
    var fallback = '';
    for (var i = 0; i < urls.length; i++) {
        var u = urls[i] || '';
        if (!u) continue;
        if (!fallback) fallback = u;
        if (u.indexOf('.m3u8') >= 0) return u;
    }
    return fallback;
}
function zhTitle(title, year) {
    if (!title) return '';
    if (hasCJK(title)) return title;
    try {
        var html = request('https://movie.douban.com/j/subject_suggest?q=' + encodeURIComponent(title), __H);
        var arr = JSON.parse(html);
        if (arr && arr.length) {
            for (var i = 0; i < arr.length; i++) {
                if (year && String(arr[i].year) === String(year) && arr[i].title) return arr[i].title;
            }
            if (arr[0].title) return arr[0].title;
        }
    } catch (e) { slog('豆瓣取中文名失败:' + e.message); }
    try {
        var g = request('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=' + encodeURIComponent(title), __H);
        var gj = JSON.parse(g);
        if (gj && gj[0] && gj[0][0] && gj[0][0][0]) return gj[0][0][0];
    } catch (e) { slog('翻译取中文名失败:' + e.message); }
    return title;
}
var CMS = [
    {name: '量子', api: 'https://lzizy1.com/api.php/provide/vod/'},
    {name: '非凡', api: 'https://api.ffzyapi.com/api.php/provide/vod/'},
    {name: '暴风', api: 'https://bfzyapi.com/api.php/provide/vod/'},
    {name: 'ikun', api: 'https://ikunzyapi.com/api.php/provide/vod/'}
];
var fyid = String(input || '');
var title = '', year = '', tmdbId = '';
var node = null;
try {
    if (/^\\d+$/.test(fyid)) {
        tmdbId = fyid;
        var html = request(HOST + '/api/v1/search?tmdbid=' + tmdbId + '&limit=1&locale=zh', __H);
        var j = JSON.parse(html);
        var arr = j.results || [];
        if (arr.length) node = arr[0];
    } else if (fyid.charAt(0) === 't') {
        title = decodeURIComponent(fyid.slice(1));
    } else {
        title = decodeURIComponent(fyid);
    }
} catch (e) { slog('TorrentClaw详情取片名失败:' + e.message); }
if (node) {
    title = node.title || title;
    year = node.year || year;
}
if (!title) title = '未知';
var froms = [], urls = [];
try {
    var zh = zhTitle(title, year);
    for (var s = 0; s < CMS.length; s++) {
        try {
            var u = CMS[s].api + '?ac=videolist&wd=' + encodeURIComponent(zh);
            var h2 = request(u, __H);
            var j2 = JSON.parse(h2);
            var list = j2.list || [];
            if (!list.length) continue;
            var best = pickBest(list, zh, year) || list[0];
            var pu = pickM3u8(best.vod_play_from, best.vod_play_url);
            if (!pu) continue;
            froms.push(CMS[s].name);
            urls.push(pu);
        } catch (e) { slog('采集搜失败 ' + CMS[s].name + ':' + e.message); }
    }
} catch (e) { slog('采集搜总失败:' + e.message); }
var content = (node && node.overview) ? node.overview : '暂无简介。';
if (node && node.genres && node.genres.length) content += '\\n类型: ' + node.genres.join(' / ');
if (node && node.contentType) content += '\\n类别: ' + (node.contentType === 'show' ? '剧集' : '电影');
if (!froms.length) content += '\\n\\n采集源暂无此片, 可用壳子搜索按中文名再搜一次。';
try {
    VOD = {
        vod_id: fyid,
        vod_name: title,
        vod_pic: (node && node.posterUrl) || '',
        type_name: (node && node.genres && node.genres.length) ? node.genres[0] : '',
        vod_year: year,
        vod_remarks: (node && node.rating) ? node.rating + '分' : '',
        vod_content: content,
        vod_play_from: froms.join('$$$'),
        vod_play_url: urls.join('$$$')
    };
} catch (e) {
    VOD = { vod_id: fyid, vod_name: title || '未知', vod_pic: '', vod_content: '详情加载失败，请返回重试。' };
}
`,

    搜索: `js:
var __UA = 'Mozilla/5.0 (Linux; Android 5.1.1; BAOFENG_TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
var __H = {headers: {'User-Agent': __UA, 'Accept': 'application/json'}};
function slog(m) { try { log(m); } catch (e) {} }
function mkUrl(it) {
    if (it.tmdbId) return String(it.tmdbId);
    return 't' + encodeURIComponent(it.title || '');
}
var d = [];
try {
    var html = request(input, __H);
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
            url: mkUrl(it)
        });
    });
} catch (e) {
    slog('TorrentClaw搜索失败:' + e.message);
}
setResult(d);
`
};
