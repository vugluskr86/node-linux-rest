"use strict";

var config    = require('config'),
    assert    = require('assert'),
    path      = require('path'),
    app       = require('express')(),
    BackboneSQL   = require('backbone-sql').sync,
    Backbone  = require('backbone'),
    RestController = require('backbone-rest');

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
    this.restControllers = {};

    //this.dbConfig   = config.get("database");
    this.httpConfig = config.get("http");

    this.saveWatch = function(timestamp, moduleName, valueName, values)
    {
        var _module = this.modules[moduleName],
            _schema = _module.DB[valueName],
            _valueStorageName = moduleName + '_' + valueName;

        console.log(timestamp + ":" + moduleName + "_" + valueName);

        if( this.moduleStorages[_valueStorageName] == undefined )
        {
            var _model = Backbone.Model.extend({
                urlRoot: 'sqlite://db.sqlite/' + _valueStorageName,
                schema : _schema
            });

            _model.prototype.sync = BackboneSQL(_model);

            var db = _model.db().ensureSchema(console.log);

            this.moduleStorages[_valueStorageName] = _model;
            this.restControllers[_valueStorageName] = new RestController(app, { model_type : _model, route : '/' + _valueStorageName });
        }

        if( Array.isArray(values) )
        {
            values.forEach(function(value)
            {
                var newValue = new this.moduleStorages[_valueStorageName](value);
                newValue.save();
            }.bind(this))
        }
        else
        {
            var newValue = new this.moduleStorages[_valueStorageName](values);
            newValue.save();
        }
    };


    this.startRest = function()
    {
        app.use(require('body-parser').json({}));
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