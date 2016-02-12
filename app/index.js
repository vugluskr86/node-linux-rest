"use strict";

var config    = require('config'),
    assert    = require('assert'),
    path      = require('path'),
    express   = require('express'),
    Sequelize = require('sequelize'),
    restful   = require('new-sequelize-restful'),
    app       = express();

/**
 * Утилита для мониторинга
 *
 * @constructor
 */
function MonitoringApp()
{
    this.modules = {};
    this.watchs  = {};
    this.moduleStorages  = {};

    this.dbConfig   = config.get("database");
    this.httpConfig = config.get("http");

    this.db = new Sequelize('sqlite', '', '', {
        host: 'localhost',
        dialect : 'sqlite',
        storage: 'database.sqlite'
    });


    this.saveWatch = function(timestamp, moduleName, valueName, values)
    {
        var _module = this.modules[moduleName],
            _schema = _module.DB[valueName],
            _valueStorageName = moduleName + '_' + valueName,
            self = this;

        if( this.moduleStorages[_valueStorageName] == undefined )
        {
            this.moduleStorages[_valueStorageName] = this.db.define(_valueStorageName, _schema, {
                freezeTableName: true
            });
        }

        if( Array.isArray(values) )
        {
            this.db.sync({force: true}).then(function()
            {
                values.forEach(function(_value)
                {
                    self.moduleStorages[_valueStorageName].create(_value);
                });
            });
        }
        else
        {
            this.db.sync({force: true}).then(function()
            {
                self.moduleStorages[_valueStorageName].create(values);
            });
        }
    };

    this.startRest = function()
    {
        app.use(require('body-parser').json({
            type: 'application/*'
        }));

        app.all(/\/api\//, (new restful(this.db)).route());
        app.listen(this.httpConfig["port"], this.httpConfig["host"]);
    };
}

/**
 * Начло работы
 */
MonitoringApp.prototype.start = function()
{
    process.on("SIGINT", function()
    {

        Object.keys(this.watchs).forEach(function(watchKey)
        {
            if(this.watchs[watchKey])
            {
                clearInterval( this.watchs[watchKey] );
            }
        }.bind(this));

        console.log('CLOSING [SIGINT]');
        process.exit();
    }.bind(this));

    this.startModule("cpu");

    this.startRest();
};

MonitoringApp.prototype.startModule = function( moduleName )
{
    const MODULE_ROOT = "monitors",
          _config = config.get("modules:" + moduleName);

    if( this.modules[moduleName] == undefined )
    {
        var modulePath = path.join(__dirname, MODULE_ROOT, moduleName),
            moduleLib = require( modulePath );

        Object.keys(moduleLib.VALUES).forEach(function(valueName)
        {
            var valueConfig = _config[valueName];

            this.addWatch(moduleName, valueName, valueConfig["timeout"]);
        }.bind(this));

        this.modules[moduleName] = moduleLib;
    }
};

MonitoringApp.prototype.addWatch = function( moduleName, valueName, intervalMs )
{
    var watchName = moduleName + "_" + valueName;

    console.log("addWatch", watchName);

    if( this.watchs[watchName] == undefined )
    {
        this.watchs[watchName] = null;

        setImmediate(function()
        {
            if( intervalMs > 0 )
            {
                this.watchs[watchName] = setInterval(function()
                {
                    var timeoutNow = Date.now(),
                        value = this.modules[moduleName]["MODULE"].getValue( valueName );

                    this.saveWatch(timeoutNow, moduleName, valueName, value);
                }.bind(this), intervalMs);
            }
            else
            {
                var timeoutNow = Date.now(),
                    value = this.modules[moduleName]["MODULE"].getValue( valueName );

                this.saveWatch(timeoutNow, moduleName, valueName, value);
            }
        }.bind(this));
    }
};

module.exports = new MonitoringApp();