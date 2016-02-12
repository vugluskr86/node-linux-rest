"use strict";

var os = require('os'),
    Sequelize = require('sequelize');

const CPU_VALUES = {
    NUM_OF_CPU: "NUM_OF_CPU",
    CPU_INFO: "CPU_INFO"
};

const DB_CONFIG = {
    NUM_OF_CPU:
    {
        value:Sequelize.INTEGER
    },
    CPU_INFO:
    {
        model: Sequelize.TEXT,
        speed: Sequelize.INTEGER,
        user: Sequelize.INTEGER,
        nice: Sequelize.INTEGER,
        sys: Sequelize.INTEGER,
        idle: Sequelize.INTEGER,
        irq: Sequelize.INTEGER
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
                    speed: value.speed,
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