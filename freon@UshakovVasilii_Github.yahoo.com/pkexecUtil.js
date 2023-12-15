import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export default class PkexecUtil {
    constructor(name) {
        this._name = name;
        this._policy = 'com.github.UshakovVasilii.freon.' + name + '.policy';
        this._actions = '/usr/share/polkit-1/actions'
        this._pkexec = GLib.find_program_in_path('pkexec');
        // Currently hardcoded in policy file.
        this._bin = '/usr/sbin/' + name;
        this._dir = this.dir();
    }

    dir() {
        let uri = (new Error()).stack.split('\n')[1];
        let prefix = this.constructor.name + '@file://'
        if (!uri.startsWith(prefix)) {
            log('[FREON] failed to guess extension directory');
            return null;
        }
        return Gio.File.new_for_path(uri.substring(prefix.length)).get_parent().get_path();
    }

    available_pkexec() {
        return !!this._pkexec;
    }

    available_bin() {
        return GLib.find_program_in_path(this._name) == this._bin;
    }

    installed() {
        return GLib.file_test(this._actions + '/' + this._policy, GLib.FileTest.EXISTS);
    }

    run(command) {
        return GLib.spawn_command_line_sync(this._pkexec + ' ' + command);
    }

    install() {
        if (!this._dir)
        {
            log('[FREON] cannot find ' + this._name + ' pkexec policy file ' + this._policy);
            return false;
        }
        try {
            this.run('install "' + this._dir + '/policies/' + this._policy + '" ' + this._actions);
        } catch(e) {}
        if (!this.installed())
        {
            log('[FREON] failed to install ' + this._name + ' pkexec policy');
            return false;
        }
        return true;
    }

    checkOrInstall() {
        if (!this.available_pkexec()) {
            log('[FREON] pkexec is not available');
            return false;
        }
        if (!this.available_bin()) {
            log('[FREON] ' + this._bin + ' is not available');
            return false;
        }
        if (!this.installed()) {
            log('[FREON] ' + this._name + ' policy is not installed yet');
            return this.install();
        }
        return true;
    }
}
