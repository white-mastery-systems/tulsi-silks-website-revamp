var Foloosipay = (function() { 
    return { 
        init: function(){
            let Foloosicssstyle = 'html,body{height:100%;background:none!important;margin: 0;}.foloosi_wrapper{height:100%;position: fixed;width: 100%;top: 0;display:none;z-index:100000;overflow-y: auto;}iframe{border:0;border-radius:5px;}#FoloosiPayPluginApiiframe{height:660px;background:#fff;border-radius:5px;margin:20px 0;}#foloosi_container {margin: 0 auto; height: 100%;text-align: center;-webkit-transition: .3s ease-out opacity;-o-transition: .3s ease-out opacity;transition: .3s ease-out opacity;z-index: 2;}#foloosi_backdrop { position: absolute;top:0px;left: 0;width: 100%;height: 100%;}#foloosi_container.foloosi_drishy {opacity: 1;white-space:nowrap;}#foloosi_modal { opacity: 1;-webkit-transform: none; -ms-transform: none;transform: none;-webkit-transition: .2s,.3s cubic-bezier(.3,1.5,.7,1) transform;-o-transition: .2s,.3s cubic-bezier(.3,1.5,.7,1) transform; transition: .2s,.3s cubic-bezier(.3,1.5,.7,1) transform;}#foloosi_modal-inner {-webkit-border-radius: 3px;border-radius: 3px;height: 100%;}.foloosi_close {position: absolute;right:5px;top:20px;cursor: pointer;background:none;border:none;color: #fff;line-height: 25px;font-size:25px;z-index: 1;padding:0;opacity:0.7;-webkit-transform: none;-ms-transform: none;transform: none;-webkit-transition: .2s,.3s cubic-bezier(.3,1.5,.7,1) transform;-o-transition: .2s,.3s cubic-bezier(.3,1.5,.7,1) transform;transition: .2s,.3s cubic-bezier(.3,1.5,.7,1) transform;}.foloosi_close:hover{opacity:1;}#foloosi_options-wrap { position: absolute;top: 50%;-webkit-transform: translateY(-50%);-ms-transform: translateY(-50%);transform: translateY(-50%);left: 12px;right: 12px;z-index: 100;}#foloosi_container.foloosi_drishy #foloosi_modal {opacity: 1;-webkit-transform: none;-ms-transform: none;transform: none;-webkit-transition: .2s,.3s cubic-bezier(.3,1.5,.7,1) transform;-o-transition: .2s,.3s cubic-bezier(.3,1.5,.7,1) transform;transition: .2s,.3s cubic-bezier(.3,1.5,.7,1) transform;}#foloosi_modal { -webkit-border-radius: 3px;border-radius: 3px; -webkit-box-sizing: border-box;box-sizing: border-box;display: inline-block;-webkit-transition: .3s ease-in;-o-transition: .3s ease-in;transition: .3s ease-in;z-index: 1;-webkit-perspective: 300;perspective: 300;position: relative; opacity: 0;-webkit-transform: scale(.9);-ms-transform: scale(.9); transform: scale(.9);color: #333;font-size: 14px;width: 344px;font-family: ubuntu,helvetica,sans-serif;}.foloosi_mchild {vertical-align: middle;display: inline-block; white-space: normal;}.foloosi_lightBackWrap{min-height: 100%; transition: all 0.3s ease-out 0s; position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6) none repeat scroll 0% 0%;pointer-events: none;}#foloosi_content{text-align: left;white-space: normal;}.foloosi_drishy:after{content:"";height:96%;display:inline-block;width:0;vertical-align:middle}',
            Foloosihead = document.head || document.getElementsByTagName('head')[0],
            Foloosistyle = document.createElement('style');
            Foloosistyle.type = 'text/css';
            if (Foloosistyle.styleSheet){
                Foloosistyle.styleSheet.cssText = Foloosicssstyle;
            } else {
                Foloosistyle.appendChild(document.createTextNode(Foloosicssstyle));
            }
            Foloosihead.appendChild(Foloosistyle);
            let FoloosiviewPortTag=document.createElement('meta');
            FoloosiviewPortTag.id="viewport";
            FoloosiviewPortTag.name = "viewport";
            FoloosiviewPortTag.content = "width=device-width; initial-scale=1.0;";
            document.getElementsByTagName('head')[0].appendChild(FoloosiviewPortTag);
            let Foloosibody = document.getElementsByTagName('body');
            let documentContent = document.createElement("div");
            documentContent.classList.add("foloosi_wrapper");
            documentContent.innerHTML = '<div id="foloosi_bgWrapAdd"></div><div id="foloosi_container"><div id="foloosi_backdrop"></div><div id="foloosi_modal" class="foloosi_mchild"><div id="foloosi_modal-inner"><div id="foloosi_content"><button id="foloosi_close" data-dismiss="modal" class="modalClose foloosi_close closemodalwrap" data-close="" type="button">&#215;</button><iframe src="data:text/html;base64,PCFET0NUWVBFIGh0bWw+DQo8aHRtbD4NCiAgICA8aGVhZD4NCiAgICAgICAgPHRpdGxlPkZvbG9vc2kgUGF5bWVudDwvdGl0bGU+DQogICAgICAgIDxtZXRhIGNoYXJzZXQ9InV0Zi04Ii8+DQogICAgICAgIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wIj4NCiAgICAgICAgPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCiAgICAgICAgICAgIEBpbXBvcnQgdXJsKCdodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2Nzcz9mYW1pbHk9UG9wcGluczo0MDAsNTAwLDUwMGksNjAwLDcwMCcpOw0KICAgICAgICAgICAgYm9keXtmb250LWZhbWlseTonUG9wcGlucycsIHNhbnMtc2VyaWY7YmFja2dyb3VuZDpub25lO30NCiAgICAgICAgICAgIC5sb2FkaW5nX3RleHRfY29udEZpcnN0e2ZvbnQtc2l6ZToyNXB4O2NvbG9yOiMwMDA7bWFyZ2luOjMwcHggMCAwO2ZvbnQtd2VpZ2h0OjcwMDt9DQogICAgICAgICAgICAubG9hZGluZ190ZXh0X2NvbnR7Zm9udC1zaXplOjEzcHg7Y29sb3I6IzU1NTttYXJnaW46MjBweCAwIDA7fQ0KICAgICAgICAgICAgLmxvYWRpbmdfaW1hZ2Vfd3JhcHBlcntwb3NpdGlvbjogZml4ZWQ7bGVmdDogMDt0b3A6IDA7d2lkdGg6IDEwMCU7aGVpZ2h0OiAxMDAlO3otaW5kZXg6IDEwMDAwMDAwMDAxO3RleHQtYWxpZ246IGNlbnRlcjtiYWNrZ3JvdW5kOiAjZjFmMWYxO29wYWNpdHk6IDE7dmlzaWJpbGl0eTogdmlzaWJsZTstd2Via2l0LXRyYW5zaXRpb246IG9wYWNpdHkgMC40cyx2aXNpYmlsaXR5IC0wLjNzIGxpbmVhciAwLjVzO3RyYW5zaXRpb246IG9wYWNpdHkgMC40cyx2aXNpYmlsaXR5IC0wLjNzIGxpbmVhciAwLjVzO30NCiAgICAgICAgICAgIC5sb2FkaW5nX2ltYWdlX2lubmVye3Bvc2l0aW9uOiBhYnNvbHV0ZTt0b3A6IDUwJTtsZWZ0OiA1MCU7LXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLC01MCUpOy1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLC01MCUpO3RyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsLTUwJSk7fQ0KICAgICAgICA8L3N0eWxlPg0KICAgIDwvaGVhZD4NCiAgICA8Ym9keT4NCiAgICAgICAgPGRpdiBjbGFzcz0ibG9hZGluZ19pbWFnZV93cmFwcGVyIj4NCiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImxvYWRpbmdfaW1hZ2VfaW5uZXIiPg0KICAgICAgICAgICAgICAgIDxpbWcgc3JjPSJodHRwczovL3dpZGdldC5mb2xvb3NpLmNvbS9pbWFnZXMvZ2lmLTMuZ2lmIi8+DQogICAgICAgICAgICAgICAgPHAgY2xhc3M9ImxvYWRpbmdfdGV4dF9jb250Rmlyc3QiPkxvYWRpbmcuLi4gPC9wPg0KICAgICAgICAgICAgICAgIDxwIGNsYXNzPSJsb2FkaW5nX3RleHRfY29udCI+IFBsZWFzZSB3YWl0IHdoaWxlIHdlIHJlZGlyZWN0IHlvdTwvcD4NCiAgICAgICAgICAgIDwvZGl2Pg0KICAgICAgICA8L2Rpdj4NCjwvYm9keT4NCjwvaHRtbD4NCg0K" id="FoloosiPayPluginApiiframe" width="100%"></iframe></div></div></div></div>';
            document.body.appendChild(documentContent);
            document.getElementById("foloosi_close").onclick = function() {
                document.getElementById("FoloosiPayPluginApiiframe").setAttribute('src','');   
                document.getElementsByClassName("foloosi_wrapper")[0].style.display = "none";     
                document.getElementById("foloosi_bgWrapAdd").classList.remove("foloosi_lightBackWrap");
                document.getElementById("foloosi_container").classList.remove("foloosi_drishy");
            };
        },
        open: function(ref,key) { 
            document.getElementById("FoloosiPayPluginApiiframe").setAttribute('src','https://widget.foloosi.com/?{"reference_token":"'+ref+'","secret_key":"'+key+'"}')
            document.getElementsByClassName("foloosi_wrapper")[0].style.display = "block";
            document.getElementById("foloosi_bgWrapAdd").classList.add("foloosi_lightBackWrap");
            document.getElementById("foloosi_container").classList.add("foloosi_drishy");
        },
        close: function() {   
            document.getElementById("FoloosiPayPluginApiiframe").setAttribute('src','');   
            document.getElementsByClassName("foloosi_wrapper")[0].style.display = "none";     
            document.getElementById("foloosi_bgWrapAdd").classList.remove("foloosi_lightBackWrap");
            document.getElementById("foloosi_container").classList.remove("foloosi_drishy");
        }
    } 
})(Foloosipay||{});
var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var successHandler = window[eventMethod];
var responseSuccess = eventMethod === "attachEvent" ? "onmessage" : "message";
var errorHandler = window[eventMethod];
var responseError = eventMethod === "attachEvent" ? "onmessage" : "message";
var foloosiHandler = window[eventMethod];
var response = eventMethod === "attachEvent" ? "onmessage" : "message";