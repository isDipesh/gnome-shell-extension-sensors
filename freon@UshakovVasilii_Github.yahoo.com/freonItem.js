const GObject = imports.gi.GObject;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;

var FreonItem = GObject.registerClass(class FreonItem extends PopupMenu.PopupBaseMenuItem {

    _init(gIcon, key, label, value, displayName) {
        super._init();
        this._main = false;
        this._key = key;
        this._gIcon = gIcon;

        this._labelActor = new St.Label({text: displayName ? displayName : label});
        this.actor.add(new St.Icon({ style_class: 'popup-menu-icon', gicon : gIcon}));
        this.actor.add(this._labelActor, {x_fill: true, expand: true});
        this._valueLabel = new St.Label({text: value});
        this.actor.add(this._valueLabel);
    }

    set main(main) {
        if(main)
            this.setOrnament(PopupMenu.Ornament.CHECK);
        else
            this.setOrnament(PopupMenu.Ornament.NONE);
        this._main = main;
    }

    get main() {
        return this._main;
    }

    get key() {
        return this._key;
    }

    set display_name(text) {
        return this._labelActor.text = text;
    }

    get gicon() {
        return this._gIcon;
    }

    set value(value) {
        this._valueLabel.text = value;
    }
});
