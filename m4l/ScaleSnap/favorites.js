/* Scale Snap - favorite scales (ES5; Max [js] legacy object and Node).
 *
 * One global list for all devices and Live Sets, stored as JSON:
 *     {"version": 1, "favorites": ["natural_minor", "hirajoshi", ...]}
 * Scales are stored by their stable id. Persistence goes through an `io` object so the logic is
 * testable; createDictIo() builds the real one on top of Max's Dict (import_json / export_json).
 */
var ScaleSnapFavorites = (function () {
    var FILE_VERSION = 1;

    // Tried in order. The first one that can be written (and read back) wins. The flat file is the
    // fallback for systems where Max cannot create the "Scale Snap" folder.
    var DEFAULT_PATHS = [
        "~/Documents/Max 8/Scale Snap/favorites.json",
        "~/Documents/Max 8/Scale Snap favorites.json",
        "~/Documents/Scale Snap favorites.json"
    ];

    /** Parse file text into a de-duplicated array of ids. Tolerates garbage (returns []). */
    function parse(text) {
        var out = [], seen = {};
        if (typeof text !== "string" || text.length === 0) { return out; }
        var data;
        try { data = JSON.parse(text); } catch (e) { return out; }
        var list = data && data.favorites;
        if (!list || typeof list.length !== "number") { return out; }
        for (var i = 0; i < list.length; i++) {
            var id = list[i];
            if (typeof id === "string" && id.length > 0 && !seen.hasOwnProperty(id)) {
                seen[id] = true;
                out.push(id);
            }
        }
        return out;
    }

    function serialize(ids) {
        return JSON.stringify({ version: FILE_VERSION, favorites: ids }, null, 2) + "\n";
    }

    /**
     * io: { read: function () -> string|null, write: function (text) -> boolean }
     * valid (optional): function (id) -> boolean, drops ids that are not in the library.
     */
    function Favorites(io, valid) {
        this.io = io;
        this.valid = valid || null;
        this.ids = [];
        this.lastError = "";
    }

    Favorites.prototype.filter = function (ids) {
        if (!this.valid) { return ids; }
        var out = [];
        for (var i = 0; i < ids.length; i++) { if (this.valid(ids[i])) { out.push(ids[i]); } }
        return out;
    };

    /** Re-read the file. Returns true if the list changed. */
    Favorites.prototype.load = function () {
        var before = this.ids.join("|");
        var text = null;
        try { text = this.io.read(); } catch (e) { this.lastError = String(e); }
        this.ids = this.filter(parse(text));
        return before !== this.ids.join("|");
    };

    Favorites.prototype.has = function (id) { return this.ids.indexOf(id) >= 0; };
    Favorites.prototype.list = function () { return this.ids.slice(); };

    Favorites.prototype.save = function () {
        try {
            var ok = this.io.write(serialize(this.ids));
            if (!ok) { this.lastError = "could not write favorites file"; }
            return !!ok;
        } catch (e) {
            this.lastError = String(e);
            return false;
        }
    };

    /** Set a favorite on/off. Re-reads the file first so other devices' changes are not lost. */
    Favorites.prototype.set = function (id, on) {
        this.load();
        var i = this.ids.indexOf(id);
        if (on && i < 0) { this.ids.push(id); }
        if (!on && i >= 0) { this.ids.splice(i, 1); }
        return this.save();
    };

    /** Flip a favorite. Returns the new state (true = now a favorite). */
    Favorites.prototype.toggle = function (id) {
        this.load();
        var on = this.ids.indexOf(id) < 0;
        this.set(id, on);
        return on;
    };

    /**
     * File I/O on top of Max's Dict. `DictCtor` is Max's Dict, `FileCtor` is Max's File (used to test
     * for existence without console errors). `paths` defaults to DEFAULT_PATHS.
     */
    function createDictIo(DictCtor, FileCtor, paths) {
        var candidates = paths || DEFAULT_PATHS;
        var writePath = null;

        function exists(path) {
            if (!FileCtor) { return true; }
            try {
                var f = new FileCtor(path, "read");
                var ok = !!f.isopen;
                if (ok) { f.close(); }
                return ok;
            } catch (e) { return false; }
        }

        function readFile(path) {
            if (!exists(path)) { return null; }
            try {
                var d = new DictCtor();
                d.import_json(path);
                var text = d.stringify();
                return typeof text === "string" ? text : null;
            } catch (e) { return null; }
        }

        return {
            read: function () {
                if (writePath) {
                    var t = readFile(writePath);
                    if (t !== null) { return t; }
                }
                for (var i = 0; i < candidates.length; i++) {
                    var text = readFile(candidates[i]);
                    if (text !== null) { writePath = candidates[i]; return text; }
                }
                return null;
            },
            write: function (text) {
                var order = writePath ? [writePath] : [];
                for (var i = 0; i < candidates.length; i++) { if (candidates[i] !== writePath) { order.push(candidates[i]); } }
                for (var j = 0; j < order.length; j++) {
                    try {
                        var d = new DictCtor();
                        d.parse(text);
                        d.export_json(order[j]);
                        var back = readFile(order[j]);
                        if (back !== null && parse(back).join("|") === parse(text).join("|")) {
                            writePath = order[j];
                            return true;
                        }
                    } catch (e) { /* try the next location */ }
                }
                return false;
            },
            path: function () { return writePath || candidates[0]; }
        };
    }

    return {
        FILE_VERSION: FILE_VERSION,
        DEFAULT_PATHS: DEFAULT_PATHS,
        parse: parse,
        serialize: serialize,
        Favorites: Favorites,
        createDictIo: createDictIo
    };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = ScaleSnapFavorites;
}
