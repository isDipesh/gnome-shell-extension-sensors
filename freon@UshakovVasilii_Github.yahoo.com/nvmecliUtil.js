const GLib = imports.gi.GLib;

const Me = imports.misc.extensionUtils.getCurrentExtension();

function getNvmeData (argv){
    const nvme = GLib.find_program_in_path('nvme')
    return JSON.parse(GLib.spawn_command_line_sync(`${nvme} ${argv} -o json`)[1].toString())
}

var nvmecliUtil  = class {
    constructor(callback) {
        this._nvmeDevices = [];
        try {
            this._nvmeDevices = getNvmeData("list")["Devices"]
        } catch (e) {
            global.log('[FREON] Unable to find nvme devices: ' + e);
        }        
        this._updated = true;
    }

    get available(){
        return this._nvmeDevices.length > 0;
    }

    get updated (){
       return this._updated;
    }

    set updated (updated){
        this._updated = updated;
    }

    get temp() {
        return this._nvmeDevices.map(device => {
            return {
                label: device["ModelNumber"],
                temp: parseFloat(getNvmeData(`smart-log ${device["DevicePath"]}`).temperature) - 273.15    
            }
        })
    }

    destroy(callback) {
        this._nvmeDevices = [];
    }

    execute(callback) {
        this._updated = true;
    }

};
