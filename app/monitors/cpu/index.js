"use strict";

var os = require('os');

const CPU_VALUES = {
    NUM_OF_CPU: "NUM_OF_CPU",
    CPU_INFO: "CPU_INFO",
    CPU_OVERAGE: "CPU_OVERAGE"
};

const DB_CONFIG = {
    NUM_OF_CPU:
    {
        value: 'Integer'
    },
    CPU_INFO:
    {
        model: 'Text',
        speed: 'Integer'
    },
    CPU_OVERAGE:
    {
        user: 'Integer',
        nice: 'Integer',
        sys:  'Integer',
        idle: 'Integer',
        irq:  'Integer'
    }
};

/**
 * Утилита для мониторинга
 *
 * @constructor
 */
function CpuMonitoring()
{
    this.cpuCount    = null;
    this.lastCpuInfo = null;

    this.fetchCpuInfo = function()
    {
        this.lastCpuInfo = os.cpus();
        this.cpuCount = this.lastCpuInfo.length;
    };

    this.getCpuCount = function()
    {
        if( this.cpuCount == null )
        {
            this.fetchCpuInfo();
        }
        return this.cpuCount;
    };

    this.getCpuInfo = function()
    {
        this.fetchCpuInfo();

        return this.lastCpuInfo;
    };
}

CpuMonitoring.prototype.getValue = function( valueName )
{
    const SW = CPU_VALUES;

    switch(valueName)
    {
        case SW.NUM_OF_CPU:
        {
            return {
                value : this.getCpuCount()
            };
        }
        case SW.CPU_INFO:
        {
            var cpuInfo = this.getCpuInfo();

            return cpuInfo.map(function(value)
            {
                return {
                    model: value.model,
                    speed: value.speed
                };
            });
        }
        case SW.CPU_OVERAGE:
        {
            var cpuInfo = this.getCpuInfo(),
                index = 0;

            return cpuInfo.map(function(value)
            {
                index++;

                return {
                    index: index,
                    user: value.times.user,
                    nice: value.times.nice,
                    sys: value.times.sys,
                    idle: value.times.idle,
                    irq: value.times.irq
                };
            });
        }
        default:
        {
            throw "UNDEFINED_VALUE_NAME : " + valueName;
        }
    }
};

module.exports.MODULE = new CpuMonitoring();
module.exports.VALUES = CPU_VALUES;
module.exports.DB     = DB_CONFIG;