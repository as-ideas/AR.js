AFRAME.registerComponent('gps-entity-place', {
    _cameraGps: null,
    schema: {
        latitude: {
            type: 'number',
            default: 0,
        },
        longitude: {
            type: 'number',
            default: 0,
        },
    },
    init: function () {
        window.addEventListener('gps-camera-origin-coord-set', function () {
            if (!this._cameraGps) {
                var camera = document.querySelector('[gps-camera]');
                if (!camera.components['gps-camera']) {
                    console.error('gps-camera not initialized')
                    return;
                }
                this._cameraGps = camera.components['gps-camera'];
            }

            this._updatePosition();
        }.bind(this));

        this._positionXDebug = 0;

        window.dispatchEvent(new CustomEvent('gps-entity-place-added'));
        console.debug('gps-entity-place-added');

        this.debugUIAddedHandler = function () {
            this.setDebugData(this.el);
            window.removeEventListener('debug-ui-added', this.debugUIAddedHandler.bind(this));
        };

        window.addEventListener('debug-ui-added', this.debugUIAddedHandler.bind(this));
    },

    /**
     * Update place position, called when a place is added (or maybe moved in the scene???)
     * but not on camera update
     * @returns {void}
     */
    _updatePosition: function () {
        var position = {x: 0, y: 0, z: 0};
        // must be origin, because all entities are place around this point
        var cameraCoords = this._cameraGps.originCoords;
        // update position.x
        var dstCoords = {
            longitude: this.data.longitude,
            latitude: cameraCoords.latitude,
        };

        position.x = this._cameraGps.computeDistanceMeters(cameraCoords, dstCoords, true);
        this._positionXDebug = position.x;
        position.x *= this.data.longitude > cameraCoords.longitude ? 1 : -1;

        // update position.z
        dstCoords = {
            longitude: cameraCoords.longitude,
            latitude: this.data.latitude,
        };

        position.z = this._cameraGps.computeDistanceMeters(cameraCoords, dstCoords, true);
        position.z *= this.data.latitude > cameraCoords.latitude ? -1 : 1;
        // update element's position in 3D world
        this.el.setAttribute('position', position);
    },

    /**
     * Set places distances from user on debug UI
     * @returns {void}
     */
    setDebugData: function (element) {
        var elements = document.querySelectorAll('.debug-distance');
        elements.forEach(function (el) {
            var distance = formatDistance(this._positionXDebug);
            if (element.getAttribute('value') == el.getAttribute('value')) {
                el.innerHTML = el.getAttribute('value') + ': ' + distance + 'far';
            }
        });
    },
});

/**
 * Format distances string
 *
 * @param {String} distance
 */
function formatDistance(distance) {
    distance = distance.toFixed(0);

    if (distance >= 1000) {
        return (distance / 1000) + ' kilometers';
    }

    return distance + ' meters';
};
