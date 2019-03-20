const GLib = imports.gi.GLib;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const CommandLineUtil = Me.imports.commandLineUtil;

var SensorsUtil = class extends CommandLineUtil.CommandLineUtil {

    constructor() {
        super();
        let path = GLib.find_program_in_path('sensors');
        // -A: Do not show adapter -j: JSON output
        this._argv = path ? [path, '-A', '-j'] : null;
    }

    get temp() {
        return this._parseGenericSensorsOutput(/^temp\d+_input/, 'temp');
    }

    get gpu() {
        return this._parseGpuSensorsOutput(/^temp\d+_input/, 'temp');
    }

    get rpm() {
        return this._parseGenericSensorsOutput(/^fan\d+_input/, 'rpm');
    }

    get volt() {
        return this._parseGenericSensorsOutput(/^in\d+_input/, 'volt');
    }

    _parseGenericSensorsOutput(sensorFilter, sensorType) {
        return this._parseSensorsOutput(sensorFilter, sensorType, false);
    }

    _parseGpuSensorsOutput(sensorFilter, sensorType) {
        return this._parseSensorsOutput(sensorFilter, sensorType, true);
    }

  _parseSensorsOutput(sensorFilter, sensorType, gpuFlag) {
        if(!this._output)
            return [];

        // Prep output as one big string for JSON parser
        let output = this._output.join('');

        let data = []
        try {
            data = JSON.parse(output);
        } catch (e) {
            global.log(e.toString());
            return [];
        }

        let sensors = [];
        for (var chipset in data) {
            let gpuFilter = /(radeon|amdgpu|nouveau)/;
            if (!data.hasOwnProperty(chipset) || gpuFlag != gpuFilter.test(chipset))
                continue;

            let chipsetSensors = data[chipset]
            for (var sensor in chipsetSensors) {
                if (!chipsetSensors.hasOwnProperty(sensor))
                    continue;

                let fields = chipsetSensors[sensor];
                for (var key in fields) {
                    if (fields.hasOwnProperty(key) && sensorFilter.test(key)) {
                        let feature = {
                            label: sensor,
                            [sensorType]: parseFloat(fields[key])
                        };
                        sensors.push(feature);
                        break;
                    }
                }
            }
        }
        return sensors;
    }
};
