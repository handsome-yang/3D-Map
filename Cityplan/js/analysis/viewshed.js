/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：视域分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
var earth = "";
var analysis;
var sInitColor = null;

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

/**
 * 可见区域选色卡点击事件
 */
function noShadowColorDlg() {
    var sColor = null;
    sInitColor = $("#noShadowColor").val();
    if (sInitColor == null) {
        sColor = dlgHelper.ChooseColorDlg();
    } else {
        sColor = dlgHelper.ChooseColorDlg(sInitColor);
    }
    sColor = sColor.toString(16);
    if (sColor.length < 6) {
        var sTempString = "00000000".substring(0, 6 - sColor.length);
        sColor = sTempString.concat(sColor);
    }
    var xColor = "0x99" + sColor;
    sColor = "#" + sColor;
    $("#noShadowColorsel").css("backgroundColor",sColor);
    $("#noShadowColor").val(sColor);
    sInitColor = sColor;
}
/**
 * 不可见区域选色卡点击事件
 */
function shadowColorDlg() {
    var sColor = null;
    sInitColor = $("#shadowColor").val();
    if (sInitColor == null) {
        sColor = dlgHelper.ChooseColorDlg();
    } else {
        sColor = dlgHelper.ChooseColorDlg(sInitColor);
    }
    sColor = sColor.toString(16);
    if (sColor.length < 6) {
        var sTempString = "00000000".substring(0, 6 - sColor.length);
        sColor = sTempString.concat(sColor);
    }
    var xColor = "0x99" + sColor;
    sColor = "#" + sColor;
    $("#shadowColorsel").css("backgroundColor",sColor);
    $("#shadowColor").val(sColor);
    sInitColor = sColor;
}
/**
 * 初始化函数
 * @param  {[obj]} earthObj [三维球对象]
 */
function getEarth(earthObj) {
    earth = earthObj;
    htmlBalloon = earthObj.htmlBallon;
    var resArr = parent.resArr;
    analysis = earthObj.analysisObj;
    var btn = [$("#btnStart"), $("#angle"), $("#height"), $("#clear")];
    $(function () {
        $("#btnStart").click(function () {
            if (check()) {
                var shadowColor = $("#shadowColor").val();
                shadowColor = "0x99" + shadowColor.substr(1,6);
                var noShadowColor = $("#noShadowColor").val();
                noShadowColor = "0x99" + noShadowColor.substr(1,6);
                analysis.clear();
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
            analysis.clearHtmlBallon(earthObj.htmlBallon);
        });
    });
    window.onunload = function () {
        analysis.clear();
        analysis.clearMenuStyle();
    };
}
/**
 * 验证视角和高度是否是数字
 * @return {[bool]} [其中任何一个不是数字,返回false;否则返回true]
 */
function check() {
    if (isNaN($("#angle").val()) == true) {
        alert("无效的视角");
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