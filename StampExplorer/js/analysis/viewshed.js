/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：视域分析
 * 注意事项：该文件方法仅为视域分析使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 ****************************************************************/
var earth = "";
var analysis;
var viewShedObj = null;//创建的视锥体
var htmlBalloon = null;//气泡

// 解决IE8-IE11的兼容性问题
var str = window.navigator.userAgent;
if(/MSIE 8.0/.test(str)){
    $("#angle").attr('onpropertychange','checkNum(this, true, 2, 100)');
    $("#height").attr('onpropertychange','checkNum(this, true, 2, 10000)');
}else{
    $("#angle").attr('oninput','checkNum(this, true, 2, 100)');
    $("#height").attr('oninput','checkNum(this, true, 2, 10000)');

};

// 开始、暂停、退出事件
function getEarth(earthObj) {
    earth = earthObj;
    htmlBalloon = earthObj.htmlBallon;
    var resArr = parent.resArr;
    analysis = STAMP.Analysis(earth);
    var btn = [$("#btnStart"), $("#angle"), $("#height"), $("#clear")];
    $(function () {
        $("#btnStart").click(function () {
            if (check()) {
                var shadowColor = $("#shadowColor").val();
                shadowColor = "0x99" + shadowColor.substr(1,6);
                var noShadowColor = $("#noShadowColor").val();
                noShadowColor = "0x99" + noShadowColor.substr(1,6);
                if (viewShedObj) {
                    earth.DetachObject(viewShedObj);
                    viewShedObj = null;
                }
                analysis.viewShed(angle.value, height.value, btn, shadowColor, noShadowColor);
            }
        });
        $("#btnStop").click(function () {
            analysis.clear();
            $("#btnStop").attr("disabled", "disabled");
            $("#btnStart").removeAttr("disabled");
            $("#angle").removeAttr("disabled");
            $("#height").removeAttr("disabled");
            $("#clear").removeAttr("disabled");
        });
        $("#clear").click(function () {
            if (viewShedObj) {
                earth.DetachObject(viewShedObj);
                viewShedObj = null;
            }
            htmlBalloon.DestroyObject();
        });
    });
    window.onunload = function () {
        analysis.clear();
        if (viewShedObj) {
            earth.DetachObject(viewShedObj);
        }

    };
}
// 对视角和高度设置范围
function check() {
    if (isNaN($("#angle").val()) == true || $("#angle").val() == 0) {
        alert("无效的视角,视角范围为0~100");
        angle.select();
        angle.focus();
        return false;
    }
    
    if (isNaN($("#height").val()) == true) {
        alert("无效的高度");
        height.select();
        height.focus();
        return false;
    }
    return true;
}