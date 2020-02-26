const ByteArray = imports.byteArray;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const CommandLineUtil = Me.imports.commandLineUtil;

var NvidiaUtil = class extends CommandLineUtil.CommandLineUtil {

    constructor() {
        super();
        let path = GLib.find_program_in_path('nvidia-smi');
        this._argv = path ? [path, '--query-gpu=temperature.gpu', '--format=csv,noheader'] : null;
        this._labels = [];
        if(this._argv){
            //     [0] ushakov-pc:0[gpu:0] (GeForce GTX 770)
            let [exit, pid, stdinFd, stdoutFd, stderrFd] =
                GLib.spawn_async_with_pipes(null, /* cwd */
                                            [path, '--query-gpu=name', '--format=csv,noheader'], /* args */
                                            null, /* env */
                                            GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                                            null /* child_setup */);

            let stdout = new Gio.UnixInputStream({fd: stdoutFd, close_fd: true});
            let outReader = new Gio.DataInputStream({base_stream: stdout});

            GLib.close(stdinFd);
            GLib.close(stderrFd);
            let childWatch = GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (pid, status, requestObj) => {
                  let output = [];
                  let [line, size] = [null, 0];

                  while (([line, size] = outReader.read_line(null)) != null && line != null) {
                      this._labels.push(ByteArray.toString(line));
                  }

                  stdout.close(null);
                  GLib.source_remove(childWatch);
            });
        }
    }

    get temp() {
        let output = [];
        if(this._output)
          output.push(...this._output)
        if(this._error_output)
          output.push(...this._error_output)

        if(output.length === 0)
            return [];
        let temps = [];
        for (let line of this._output) {
            let convertedLine = parseFloat(line);

            if(!line || !convertedLine)
                continue;
            temps.push(convertedLine);
        }

        let gpus = [];

        if(this._labels.length == temps.length){
            for(let i = 0; i < this._labels.length; i++){
                gpus.push({ label: this._labels[i], temp: temps[i] })
            }
        }

        return gpus;
    }

};
