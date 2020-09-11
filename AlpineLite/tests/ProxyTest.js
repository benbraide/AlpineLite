import * as ProxyScope from '../src/Proxy';
import * as ChangesScope from '../src/Changes';
import * as StateScope from '../src/State';
import { expect, assert } from 'chai';
describe('Proxy object', () => {
    it('Should return null on non-object value', () => {
        let value = 9;
        let details = {
            target: value,
            name: null,
            parent: null,
            element: null,
            state: null
        };
        expect(ProxyScope.AlpineLite.Proxy.Create(details)).null;
        value = 'MyString';
        details.target = value;
        expect(ProxyScope.AlpineLite.Proxy.Create(details)).null;
    });
    it('Should not return null on object value', () => {
        let details = {
            target: {},
            name: null,
            parent: null,
            element: null,
            state: null
        };
        expect(ProxyScope.AlpineLite.Proxy.Create(details)).not.null;
    });
    it('Should get, set, and delete keys', () => {
        let details = {
            target: {},
            name: null,
            parent: null,
            element: null,
            state: null
        };
        let proxy = ProxyScope.AlpineLite.Proxy.Create(details);
        assert(proxy);
        let proxyIntern = proxy.GetProxy();
        assert(proxyIntern);
        expect(proxyIntern['myKey']).null;
        expect(proxyIntern['myKey'] = 18).to.equal(18);
        expect(proxyIntern['myKey']).to.equal(18);
        delete proxyIntern['myKey'];
        expect(proxyIntern['myKey']).null;
    });
    it('Should report correct paths', () => {
        let details = {
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
        let proxy = ProxyScope.AlpineLite.Proxy.Create(details);
        assert(proxy);
        let proxyIntern = proxy.GetProxy();
        assert(proxyIntern);
        expect(proxy.GetPath()).to.equal('root');
        let otherIntern = proxyIntern['other'];
        assert(otherIntern);
        expect(typeof otherIntern).to.equal('object');
        let other = proxy.GetChildProxy('other');
        assert(other);
        expect(other.GetPath()).to.equal('root.other');
    });
    it('Should report accesses', () => {
        let details = {
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
        expect(details.state.GetChanges().RetrieveGetAccessStorage().IsEmpty()).true;
        let getAccesses = {};
        details.state.GetChanges().PushGetAccessStorage(getAccesses);
        expect(details.state.GetChanges().RetrieveGetAccessStorage().IsEmpty()).false;
        let proxy = ProxyScope.AlpineLite.Proxy.Create(details);
        assert(proxy);
        let proxyIntern = proxy.GetProxy();
        assert(proxyIntern);
        let dummy = proxyIntern['int'];
        expect(Object.keys(getAccesses).length).to.equal(1);
        expect(getAccesses['root.int']).to.equal('int');
        dummy = proxyIntern['other']['val'];
        expect(Object.keys(getAccesses).length).to.equal(3);
        expect(getAccesses['root.other']).to.equal('other');
        expect(getAccesses['root.other.val']).to.equal('val');
    });
});
