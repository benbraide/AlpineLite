import * as StateScope from './State'
import * as ProxyScope from './Proxy'
import * as HandlerScope from './Handler'
import * as ChangesScope from './Changes'
import * as EvaluatorScope from './Evaluator'
import * as ProcessorScope from './Processor'
import * as CoreHandlerScope from './CoreHandler'
import * as CoreBulkHandlerScope from './CoreBulkHandler'

export namespace AlpineLite{
    interface DataRegion{
        element: HTMLElement;
        data: ProxyScope.AlpineLite.Proxy;
        state: StateScope.AlpineLite.State;
        processor: ProcessorScope.AlpineLite.Processor;
        handler: HandlerScope.AlpineLite.Handler;
        observer: MutationObserver;
    }
    
    export class Bootstrap{
        private dataRegions_ = new Array<DataRegion>();

        public InitializeHandlers(handler: HandlerScope.AlpineLite.Handler): void{
            CoreHandlerScope.AlpineLite.CoreHandler.AddAll(handler);
            CoreBulkHandlerScope.AlpineLite.CoreBulkHandler.AddAll(handler);
        }

        public Attach(msDelay: number = 10): void{
            this.Attach_('data-x-data', msDelay);
            this.Attach_('x-data', msDelay);
        }

        private Attach_(attr: string, msDelay: number): void{
            document.querySelectorAll(`[${attr}]`).forEach((element: Element): void => {
                let attributeValue = element.getAttribute(attr);
                if (!attributeValue){//Probably contained inside another region
                    return;
                }
                
                let state = new StateScope.AlpineLite.State(new ChangesScope.AlpineLite.Changes(msDelay), (element as HTMLElement), (id: string): any => {
                    for (let i = 0; i < this.dataRegions_.length; ++i){
                        if (this.dataRegions_[i].element.id === id || this.dataRegions_[i].element.dataset['id'] === id){
                            return this.dataRegions_[i].data.GetProxy();
                        }
                    }

                    return null;
                });

                let data = EvaluatorScope.AlpineLite.Evaluator.Evaluate(attributeValue, state);
                if (typeof data === 'function'){
                    data = (data as () => {})();
                }
                
                let proxyData = ProxyScope.AlpineLite.Proxy.Create({
                    target: data,
                    name: null,
                    parent: null,
                    element: null,
                    state: state
                });

                if (!proxyData){
                    proxyData = ProxyScope.AlpineLite.Proxy.Create({
                        target: {},
                        name: null,
                        parent: null,
                        element: null,
                        state: state
                    });
                }
                
                let handler = new HandlerScope.AlpineLite.Handler();
                let processor = new ProcessorScope.AlpineLite.Processor(state, handler);

                let observer = new MutationObserver(function(mutations) {
                    mutations.forEach((mutation) => {
                        mutation.removedNodes.forEach((element: Node) => {
                            if (element.nodeType != 1){
                                return;
                            }
                            
                            let uninitKey = CoreHandlerScope.AlpineLite.CoreHandler.GetUninitKey();
                            if (uninitKey in element){//Execute uninit callback
                                (element[uninitKey] as () => {})();
                                delete element[uninitKey];
                            }

                            CoreBulkHandlerScope.AlpineLite.CoreBulkHandler.RemoveOutsideEventHandlers(element as HTMLElement);
                        });

                        mutation.addedNodes.forEach((element: Node) => {
                            processor.All(element, {
                                checkTemplate: true,
                                checkDocument: false
                            });
                        });
                    });
                });
                
                state.PushValueContext(proxyData.GetProxy());
                this.dataRegions_.push({
                    element: (element as HTMLElement),
                    data: proxyData,
                    state: state,
                    processor: processor,
                    handler: handler,
                    observer: observer
                });

                ProxyScope.AlpineLite.Proxy.AddCoreSpecialKeys();
                CoreBulkHandlerScope.AlpineLite.CoreBulkHandler.AddAll(handler);
                CoreHandlerScope.AlpineLite.CoreHandler.AddAll(handler);

                processor.All(element);
                observer.observe(element, {
                    childList: true,
                    subtree: true,
                    characterData: false,
                });
            });
        }
    }
}
