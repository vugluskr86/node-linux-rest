"use strict";

var os = require('os');

const _VALUES = {
    FREE_MEM: "FREE_MEM",
    TOTAL_MEM: "TOTAL_MEM"
};

const DB_CONFIG = {
    FREE_MEM:
    {
        value:'Integer'
    },
    TOTAL_MEM:
    {
        value:'Integer'
    }
};

/**
 * Утилита для мониторинга
 *
 * @constructor
 */
function MemoryMonitoring()
{

}

MemoryMonitoring.prototype.getValue = function( valueName )
{
    const SW = _VALUES;

    switch(valueName)
    {
        case SW.FREE_MEM:
        {
            return {
                value : os.freemem()
            };
        }
        case SW.TOTAL_MEM:
        {
            return {
                value : os.totalmem()
            };
        }
        default:
        {
            throw "UNDEFINED_VALUE_NAME : " + valueName;
        }
    }
};

module.exports.MODULE = new MemoryMonitoring();
module.exports.VALUES = _VALUES;
module.exports.DB     = DB_CONFIG;