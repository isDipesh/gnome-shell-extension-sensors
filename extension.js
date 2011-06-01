const St = imports.gi.St;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;

PanelMenu.SystemStatusButton.prototype.updateActor = function(_newActor){
    this._iconActor = _newActor;
    this.actor.set_child(this._iconActor);
}

function DoIt() {
    this._init.apply(this, arguments);
}

DoIt.prototype = {
    __proto__: PanelMenu.SystemStatusButton.prototype,
	
    _init: function(){
        PanelMenu.SystemStatusButton.prototype._init.call(this, '', 'Temperature of CPU');
	let section = new PopupMenu.PopupMenuSection("Temperature");
        this._update_temp();
	GLib.timeout_add(0, 15000,
        Lang.bind(this,
        function () {
            this._update_temp();
            return true;
        }));
		
    },
	
    _update_temp: function(){
        let temperature = GLib.file_get_contents('/sys/bus/acpi/devices/LNXTHERM\:00/thermal_zone/temp');
	let c=0;
        if(temperature[0]){
            c = parseInt(temperature[1])/1000;
            this.statusLabel = new St.Label({
                text: (c.toString()+" C")
            });

            let children = this.menu.box.get_children();
            for (let i=0; i < children.length; i++) {
                children[i].destroy();
            }
            let section = new PopupMenu.PopupMenuSection("Temperature");
            this.menu.addMenuItem(section);
            let item = new PopupMenu.PopupMenuItem("");
            //fahrenheit
            item.addActor(new St.Label({ text:c.toString()+" C / "+((9/5)*c+32).toFixed(1).toString()+" F", style_class: "sm-label"}));
            section.addMenuItem(item);
        }
        else{
            this.statusLabel = new St.Label({
                text: ("Error")
            });
            global.log("Couldn't read temperature from file!");
        }
        this.updateActor(this.statusLabel);
    }
}

function main() {
    Panel.STANDARD_TRAY_ICON_ORDER.unshift('temperature');
    Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['temperature'] = DoIt;
}
