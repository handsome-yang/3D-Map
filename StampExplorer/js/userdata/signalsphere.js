/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：雷达基站
 * 注意事项：该文件方法仅为雷达基站使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/
var isSubmit = false;
var userdataObj = window.dialogArguments;
var COLOR_16_REGEXP = /^#[0-9a-fA-F]{8}$/;
returnValue = null;

function submit() {
    isSubmit = true;
    var radius = $('#radius').val(),
        segment = $('#segment').val(),
        color = $('#color').val(),
        transparency = $('#lineTransparency').val(),
        description = $('#description').val();
    transparency = parseInt(transparency).toString(16);//parseInt(x,16);
    color = color.substr(1);
    color = "#" + transparency + color;
    if (radius == '' || isNaN(radius) || radius <= 0) {
        alert('半径需为正数');
        return;
    }
    if (segment == '' || isNaN(segment) || segment <= 0) {
        alert('分割数需为正数');
        return;
    }
    if (!COLOR_16_REGEXP.test(color)) {
        alert('无效的颜色');
        return;
    }
    if (userdataObj != null) {
        userdataObj.click = "true";
        var name = $("#sphereName").val();
        userdataObj.name = name;
        userdataObj.desc = description;
        userdataObj.radius = radius;
        userdataObj.segment = segment;
        userdataObj.linecolor = color;
    }
    returnValue = userdataObj;
    window.close();
}
// 获取用户对象属性
function attributeUserdata() {
    document.getElementById("sphereName").value = userdataObj.name;

    if ("add" == userdataObj.action) {
        return;
    } else if ("edit" == userdataObj.action) {
        document.getElementById("radius").value = userdataObj.radius.toFixed(2);
        document.getElementById("segment").value = userdataObj.segment;

        var lineColor = userdataObj.linecolor;
        var lineColorLen = lineColor.length;
        if (lineColorLen === 3) {// ""#0000ff" #ff" 蓝色 前两位都为0
            var colorStr = lineColor.substring(1);
            document.getElementById("color").value = "#" + "0000" + colorStr;
            document.getElementById("lineTransparency").value = 0;
            document.getElementById("lineColorSel").style.background = "#" + "0000" + colorStr;
        } else if (lineColorLen === 5) {
            var colorStr = lineColor.substring(1);
            document.getElementById("color").value = "#" + "00" + colorStr;
            document.getElementById("lineTransparency").value = 0;
            document.getElementById("lineColorSel").style.background = "#" + "00" + colorStr;
        } else if (lineColorLen === 7) { // "#ff0000"
            document.getElementById("color").value = lineColor;
            document.getElementById("lineTransparency").value = 0;
            document.getElementById("lineColorSel").style.background = lineColor;
        } else if (lineColorLen === 8) { // "#aff0000"
            var colorStr = lineColor.substring(2);
            var HEX = lineColor.substr(1, 1);
            document.getElementById("color").value = "#" + colorStr;
            document.getElementById("lineTransparency").value = parseInt("0x" + HEX);
            document.getElementById("lineColorSel").style.background = "#" + colorStr;
        } else if (lineColorLen === 9) {
            var colorStr = lineColor.substring(3);
            document.getElementById("color").value = "#" + colorStr;
            var HEX = lineColor.substr(1, 2);
            document.getElementById("lineTransparency").value = parseInt("0x" + HEX);
            document.getElementById("lineColorSel").style.background = "#" + colorStr;
        }

        document.getElementById("description").value = userdataObj.desc;
    }
}
// 取消按钮
function closeWindow() {
    isSubmit = false;
    userdataObj.click = "false";
    window.close();
}
//关闭子窗口时
function unload() {
    if (!isSubmit) {
        userdataObj.click = "true";
    }
}
