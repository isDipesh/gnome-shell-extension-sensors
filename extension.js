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
	let title='Error';
	let content='Could not read temperature from your system, please report!';
        let f = new Array();
        f[1]='/sys/bus/acpi/devices/LNXTHERM\:00/thermal_zone/temp';
        f[2]='/sys/devices/virtual/thermal/thermal_zone0/temp';
        let c=0;
        let temperature;
        for (let i=1;i<=2;i++){
	if(GLib.file_test(f[i],1<<4)){
            temperature = GLib.file_get_contents(f[i]);
            if(temperature[0]){
                c = parseInt(temperature[1])/1000;
		title=c.toString()+"\u1d3cC";
                content=c.toString()+"\u1d3cC / "+((9/5)*c+32).toFixed(1).toString()+"\u1d3cF";
                continue;
            }
	}
        
}
        this.statusLabel = new St.Label({
            text: (title)
        });
        let children = this.menu.box.get_children();
        for (let i=0; i < children.length; i++) {
            children[i].destroy();
        }
        let section = new PopupMenu.PopupMenuSection("Temperature");
        this.menu.addMenuItem(section);
        let item = new PopupMenu.PopupMenuItem("");
        //fahrenheit
        item.addActor(new St.Label({ text:content, style_class: "sm-label"}));
        section.addMenuItem(item);
        this.updateActor(this.statusLabel);
    }
}

function main() {
    Panel.STANDARD_TRAY_ICON_ORDER.unshift('temperature');
    Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['temperature'] = DoIt;
}
