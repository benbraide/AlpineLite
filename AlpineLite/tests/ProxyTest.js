"use strict";
exports.__esModule = true;
var ProxyScope = require("../src/Proxy");
var ChangesScope = require("../src/Changes");
var StateScope = require("../src/State");
var chai_1 = require("chai");
describe('Proxy object', function () {
    it('Should return null on non-object value', function () {
        var value = 9;
        var details = {
            target: value,
            name: null,
            parent: null,
            element: null,
            state: null
        };
        chai_1.expect(ProxyScope.AlpineLite.Proxy.Create(details))["null"];
        value = 'MyString';
        details.target = value;
        chai_1.expect(ProxyScope.AlpineLite.Proxy.Create(details))["null"];
    });
    it('Should not return null on object value', function () {
        var details = {
            target: {},
            name: null,
            parent: null,
            element: null,
            state: null
        };
        chai_1.expect(ProxyScope.AlpineLite.Proxy.Create(details)).not["null"];
    });
    it('Should get, set, and delete keys', function () {
        var details = {
            target: {},
            name: null,
            parent: null,
            element: null,
            state: null
        };
        var proxy = ProxyScope.AlpineLite.Proxy.Create(details);
        chai_1.assert(proxy);
        var proxyIntern = proxy.GetProxy();
        chai_1.assert(proxyIntern);
        chai_1.expect(proxyIntern['myKey'])["null"];
        chai_1.expect(proxyIntern['myKey'] = 18).to.equal(18);
        chai_1.expect(proxyIntern['myKey']).to.equal(18);
        delete proxyIntern['myKey'];
        chai_1.expect(proxyIntern['myKey'])["null"];
    });
    it('Should report correct paths', function () {
        var details = {
            target: {
                "init": "My Int",
                "other": {
                    val: 18
                }
            },
            name: null,
            parent: null,
            element: null,
            state: null
        };
        var proxy = ProxyScope.AlpineLite.Proxy.Create(details);
        chai_1.assert(proxy);
        var proxyIntern = proxy.GetProxy();
        chai_1.assert(proxyIntern);
        chai_1.expect(proxy.GetPath()).to.equal('root');
        var otherIntern = proxyIntern['other'];
        chai_1.assert(otherIntern);
        chai_1.expect(typeof otherIntern).to.equal('object');
        var other = proxy.GetChildProxy('other');
        chai_1.assert(other);
        chai_1.expect(other.GetPath()).to.equal('root.other');
    });
    it('Should report accesses', function () {
        var details = {
            target: {
                "init": "My Int",
                "other": {
                    val: 18
                }
            },
            name: null,
            parent: null,
            element: null,
            state: new StateScope.AlpineLite.State(new ChangesScope.AlpineLite.Changes(0), null)
        };
        chai_1.expect(details.state.GetChanges().RetrieveGetAccessStorage().IsEmpty())["true"];
        var getAccesses = {};
        details.state.GetChanges().PushGetAccessStorage(getAccesses);
        chai_1.expect(details.state.GetChanges().RetrieveGetAccessStorage().IsEmpty())["false"];
        var proxy = ProxyScope.AlpineLite.Proxy.Create(details);
        chai_1.assert(proxy);
        var proxyIntern = proxy.GetProxy();
        chai_1.assert(proxyIntern);
        var dummy = proxyIntern['int'];
        chai_1.expect(Object.keys(getAccesses).length).to.equal(1);
        chai_1.expect(getAccesses['root.int']).to.equal('int');
        dummy = proxyIntern['other']['val'];
        chai_1.expect(Object.keys(getAccesses).length).to.equal(3);
        chai_1.expect(getAccesses['root.other']).to.equal('other');
        chai_1.expect(getAccesses['root.other.val']).to.equal('val');
    });
});
