/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：二维对象
 * 注意事项：该文件方法仅为二维对象使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/
var userdataObj = window.dialogArguments;
var isSubmit = false;
// 弹框点击确定事件
function polygon_submit() {
    isSubmit = true;
    if (check()) {
        returnValue();
        window.close();
    }
}
/**
 * [returnValue 返回弹框中的值]
 * @return {[obj]} [子窗口返回的对象]
 */
function returnValue() {
    if (userdataObj != null) {
        userdataObj.click = "true";
        var name = document.getElementById("lineRingName").value;
        userdataObj.name = name;

        var description = document.getElementById("description").value;
        userdataObj.desc = description;
        var LineWidth = document.getElementById("lineWidth").value;
        userdataObj.linewidth = LineWidth;

        //填充透明度
        var transparency = document.getElementById("transparency").value;
        transparency = parseInt(transparency).toString(16);
        if (transparency.length == 1) {
            transparency = "0" + transparency;
        } else if (transparency.length === 0) {
            transparency = "00";
        }

        //填充色
        var fillColor = document.getElementById("fillColor").value;
        fillColor = fillColor.substring(1);
        userdataObj.fillcolor = "#" + transparency + fillColor;

        var lineAlpha = document.getElementById("lineAlphaValue").value;
        lineAlpha = parseInt(lineAlpha).toString(16);
        if (lineAlpha.length == 1) {
            lineAlpha = "0" + lineAlpha;
        } else if (lineAlpha.length === 0) {
            lineAlpha = "00";
        }

        var lineColor = document.getElementById("lineColorInput").value;
        lineColor = lineColor.substr(1);
        userdataObj.linecolor = "#" + lineAlpha + lineColor;
        var ShadowType = document.getElementById("shadow").value;
        userdataObj.shadow = ShadowType;
        userdataObj.arrow = document.getElementById("unit").value;
        if (userdataObj.arrow === "") {
            userdataObj.arrow = 0;
        }

        userdataObj.selectable = document.getElementById("selectable").value;
        userdataObj.editable = document.getElementById("editable").value;

        //半径
        userdataObj.radius = document.getElementById("radiusValue").value;
        //扇形角度
        userdataObj.angle = document.getElementById("sectorAngleValue").value;
        //长轴半径
        userdataObj.longRadius = document.getElementById("longAxisValue").value;
        //短轴半径
        userdataObj.shortRadius = document.getElementById("shortAxisValue").value;

        var drawOrder = document.getElementById("drawOrder").value;
        userdataObj.drawOrder = drawOrder;

        userdataObj.perimeter = document.getElementById("perimeterValue").value;
        userdataObj.area = document.getElementById("areaValue").value;
    }
    return userdataObj;
}
// 对输入值进行范围限制
function check() {
    if (lineRingName.value == "") {
        alert("名称不能为空!");
        lineRingName.focus();
        return false;
    }
    if (containSpecial(lineRingName.value)) {
        alert("名称不能有特殊字符！");
        lineRingName.focus();
        return false;
    }
    var transparency = document.getElementById("transparency").value;
    if ("" == transparency) {
        alert("透明度不能为空!");
        document.getElementById("transparency").focus();
        return false;
    }
    if (isNaN(transparency)) {
        alert("透明度必须是数字！");
        document.getElementById("transparency").focus();
        return false;
    }
    if (parseInt(transparency) < 0 || parseInt(transparency) > 255) {
        alert("透明度超出范围！");
        document.getElementById("transparency").focus();
        return false;
    }
    var lineTransparency = document.getElementById("lineAlphaValue").value;
    if ("" == lineTransparency) {
        alert("透明度不能为空!");
        document.getElementById("lineAlphaValue").focus();
        return false;
    }
    if (isNaN(lineTransparency)) {
        alert("透明度必须是数字！");
        document.getElementById("lineAlphaValue").focus();
        return false;
    }
    if (parseInt(lineTransparency) < 0 || parseInt(lineTransparency) > 255) {
        alert("透明度超出范围！");
        document.getElementById("lineAlphaValue").focus();
        return false;
    }
    var lineWidth = document.getElementById("lineWidth").value;
    if ("" == lineWidth) {
        alert("请输入线宽！");
        document.getElementById("lineWidth").focus();
        return false;
    }
    if (isNaN(lineWidth)) {
        alert("线宽输入不正确！");
        document.getElementById("lineWidth").focus();
        return false;
    }
    if (lineWidth <= 0) {
        alert("线宽输入不正确！");
        document.getElementById("lineWidth").focus();
        return false;
    }
    var drawOrder = document.getElementById("drawOrder").value;
    if ("" != drawOrder) {
        if (isNaN(drawOrder)) {
            alert("渲染顺序输入不正确！");
            document.getElementById("drawOrder").focus();
            return false;
        }
        if (drawOrder < 0) {
            alert("渲染顺序输入不正确！");
            document.getElementById("drawOrder").focus();
            return false;
        }
    }

    if (userdataObj.type == "227") {
        var radiusValue = document.getElementById("radiusValue").value;
        if ("" == radiusValue) {
            alert("请输入半径！");
            document.getElementById("radiusValue").focus();
            return false;
        }
        if (isNaN(radiusValue)) {
            alert("半径输入不正确！");
            document.getElementById("radiusValue").focus();
            return false;
        }
    }
    if (userdataObj.type == "243") {
        var longAxisValue = document.getElementById("longAxisValue").value;
        if ("" == longAxisValue) {
            alert("请输入长轴半径！");
            document.getElementById("longAxisValue").focus();
            return false;
        }
        if (isNaN(longAxisValue)) {
            alert("长轴半径输入不正确！");
            document.getElementById("longAxisValue").focus();
            return false;
        }
        var shortAxisValue = document.getElementById("shortAxisValue").value;
        if ("" == shortAxisValue) {
            alert("请输入短轴半径！");
            document.getElementById("shortAxisValue").focus();
            return false;
        }
        if (isNaN(shortAxisValue)) {
            alert("短轴半径输入不正确！");
            document.getElementById("shortAxisValue").focus();
            return false;
        }
    }
    if (userdataObj.type == "228") {
        var radiusValue = document.getElementById("radiusValue").value;
        if ("" == radiusValue) {
            alert("请输入半径！");
            document.getElementById("radiusValue").focus();
            return false;
        }
        if (isNaN(radiusValue)) {
            alert("半径输入不正确！");
            document.getElementById("radiusValue").focus();
            return false;
        }
        var sectorAngleValue = document.getElementById("sectorAngleValue").value;
        if ("" == sectorAngleValue) {
            alert("请输入扇面夹角！");
            document.getElementById("sectorAngleValue").focus();
            return false;
        }
        if (isNaN(sectorAngleValue)) {
            alert("扇面夹角输入不正确！");
            document.getElementById("sectorAngleValue").focus();
            return false;
        }
    }
    return true;
}

function checkTagDisplay() {
    //标签可见性控制
    switch (userdataObj.type) {
        case 220:
            document.getElementById('sectorAngle').style.display = 'none';
            document.getElementById('shortAxis').style.display = 'none';
            document.getElementById('longAxis').style.display = 'none';
            document.getElementById('radius').style.display = 'none';
            document.getElementById('area').style.display = 'none';
            document.getElementById('perimeter').style.display = 'none';
            document.getElementById('fill').style.display = 'none';
            document.getElementById('fillAlpha').style.display = 'none';
            break;
        case 229:
            document.getElementById('sectorAngle').style.display = 'none';
            document.getElementById('shortAxis').style.display = 'none';
            document.getElementById('longAxis').style.display = 'none';
            document.getElementById('radius').style.display = 'none';
            document.getElementById('area').style.display = 'none';
            document.getElementById('perimeter').style.display = 'none';
            document.getElementById('lineLength').style.display = 'none';
            document.getElementById("fill").style.display = "none";
            document.getElementById('fillAlpha').style.display = 'none';
            break;
        case 211:
            document.getElementById('sectorAngle').style.display = 'none';
            document.getElementById('shortAxis').style.display = 'none';
            document.getElementById('longAxis').style.display = 'none';
            document.getElementById('radius').style.display = 'none';
            document.getElementById('lineLength').style.display = 'none';
            break;
        case 227:
            document.getElementById('sectorAngle').style.display = 'none';
            document.getElementById('shortAxis').style.display = 'none';
            document.getElementById('longAxis').style.display = 'none';
            document.getElementById('lineLength').style.display = 'none';
            break;
        case 243:
            document.getElementById('radius').style.display = 'none';
            document.getElementById('sectorAngle').style.display = 'none';
            document.getElementById('lineLength').style.display = 'none';
            break;
        case 228:
            document.getElementById('shortAxis').style.display = 'none';
            document.getElementById('longAxis').style.display = 'none';
            document.getElementById('lineLength').style.display = 'none';
            break;
        default:
            break;
    }
    ;
}
// 获取对象属性
function attributeUserdata() {

    checkTagDisplay();

    // 长轴半径 短轴半径
    if (userdataObj.type === 243) {
        var longValue = userdataObj.longRadius.toFixed(3);
        var shortValue = userdataObj.shortRadius.toFixed(3);
        document.getElementById("longAxisValue").value = longValue;
        document.getElementById("shortAxisValue").value = shortValue;
    }
    if (userdataObj.type === 211) {
        document.getElementById("areaValue").value = Math.abs(userdataObj.area.toFixed(2));
        document.getElementById("perimeterValue").value = userdataObj.perimeter.toFixed(2);
        document.getElementById("areaValue1").value = Math.abs(userdataObj.area.toFixed(2));
    }
    if (userdataObj.type === 228) {
        document.getElementById("sectorAngleValue").value = userdataObj.angle.toFixed(2);
    }

    document.getElementById("lineRingName").value = userdataObj.name;
    if (userdataObj.type === 220 || userdataObj.type === 229) {
        document.getElementById("arrow").style.display = "";
        document.getElementById("fill").style.display = "none";
        if (userdataObj.arrow === undefined) {
            document.getElementById("unit").value = 0;
        } else {
            document.getElementById("unit").value = userdataObj.arrow;
        }
    }

    //半径
    if (userdataObj.type === 228 || userdataObj.type === 227) {
        document.getElementById("radiusValue").value = userdataObj.radius.toFixed(2);
        ;
    }

    if ("add" == userdataObj.action) {
        return;
    } else if ("edit" === userdataObj.action || "parallel" === userdataObj.action) {
        var nodeObj = null;
        var lineRingName = userdataObj.name;
        document.getElementById("lineRingName").value = lineRingName;
        var lineColor = userdataObj.linecolor;
        var lineColorLen = lineColor.length;
        if (lineColorLen === 3) {// ""#0000ff" #ff" 蓝色 前两位都为0
            var colorStr = lineColor.substring(1);
            document.getElementById("lineColorInput").value = "#" + "0000" + colorStr;
            document.getElementById("lineAlphaValue").value = 0;
            document.getElementById("lineColorSel").style.background = "#" + "0000" + colorStr;
        } else if (lineColorLen === 5) {
            var colorStr = lineColor.substring(1);
            document.getElementById("lineColorInput").value = "#" + "00" + colorStr;
            document.getElementById("lineAlphaValue").value = 0;
            document.getElementById("lineColorSel").style.background = "#" + "00" + colorStr;
        } else if (lineColorLen === 7) { // "#ff0000"
            document.getElementById("lineColorInput").value = lineColor;
            document.getElementById("lineAlphaValue").value = 0;
            document.getElementById("lineColorSel").style.background = lineColor;
        } else if (lineColorLen === 8) { // "#aff0000"
            var colorStr = lineColor.substring(2);
            var HEX = lineColor.substr(1, 1);
            document.getElementById("lineColorInput").value = "#" + colorStr;
            document.getElementById("lineAlphaValue").value = parseInt("0x" + HEX);
            document.getElementById("lineColorSel").style.background = "#" + colorStr;
        } else if (lineColorLen === 9) {
            var colorStr = lineColor.substring(3);
            document.getElementById("lineColorInput").value = "#" + colorStr;
            var HEX = lineColor.substr(1, 2);
            document.getElementById("lineAlphaValue").value = parseInt("0x" + HEX);
            document.getElementById("lineColorSel").style.background = "#" + colorStr;
        }
        //面颜色
        var fillColor;
        var transparency;
        if (userdataObj.type != 220 && userdataObj.type != 229) {//不是线条
            fillColor = userdataObj.fillcolor;
            var fillColorLen = fillColor.length;
            if (fillColorLen === 3) {// ""#0000ff" #ff" 蓝色 前两位都为0
                var colorStr = fillColor.substring(1);
                document.getElementById("fillColor").value = "#" + "0000" + colorStr;
                document.getElementById("transparency").value = 0;
                document.getElementById("fillColorSel").style.background = "#" + "0000" + colorStr;
            } else if (fillColorLen === 5) {
                var colorStr = fillColor.substring(1);
                document.getElementById("fillColor").value = "#" + "00" + colorStr;
                document.getElementById("transparency").value = 0;
                document.getElementById("fillColorSel").style.background = "#" + "00" + colorStr;
            } else if (fillColorLen === 7) { // "#ff0000"
                document.getElementById("fillColor").value = fillColor;
                document.getElementById("transparency").value = 0;
                document.getElementById("fillColorSel").style.background = fillColor;
            } else if (fillColorLen === 8) { // "#aff0000"
                var colorStr = fillColor.substring(2);
                var HEX = fillColor.substr(1, 1);
                document.getElementById("fillColor").value = "#" + colorStr;
                document.getElementById("transparency").value = parseInt("0x" + HEX);
                document.getElementById("fillColorSel").style.background = "#" + colorStr;
            } else if (fillColorLen === 9) {
                var colorStr = fillColor.substring(3);
                document.getElementById("fillColor").value = "#" + colorStr;
                var HEX = fillColor.substr(1, 2);
                document.getElementById("transparency").value = parseInt("0x" + HEX);
                document.getElementById("fillColorSel").style.background = "#" + colorStr;
            }
        }

        var lineWidth = userdataObj.linewidth;
        document.getElementById("lineWidth").value = lineWidth;
        var description = userdataObj.desc;
        document.getElementById("description").value = description;
        var ShadowType = userdataObj.shadow;
        document.getElementById("shadow").value = ShadowType;
        document.getElementById("selectable").value = userdataObj.selectable.toString();
        document.getElementById("editable").value = userdataObj.editable.toString();
        if (userdataObj.lineLength) {
            document.getElementById("lineLengthValue").value = userdataObj.lineLength.toFixed(2);
        }
        ;

        if (userdataObj.perimeter) {
            document.getElementById("perimeterValue").value = userdataObj.perimeter.toFixed(2);
        }
        if (userdataObj.area) {
            document.getElementById("areaValue").value = Math.abs(userdataObj.area.toFixed(2));
        }

        document.getElementById("drawOrder").value = userdataObj.drawOrder;
    }
    editablesel();
}
// 对象是否能被选中
function editablesel() {
    if (document.getElementById("selectable").value == "false") {
        document.getElementById("editable").selectedIndex = 1;
        document.getElementById("editable").disabled = true;
    }
    else {
        document.getElementById("editable").disabled = false;
    }
}

// 退出
function closeWindow() {
    isSubmit = false;
    userdataObj.click = "false";
    window.close();
}

function unloadWindow() {
    if (!isSubmit) {
        userdataObj.click = "false";
    }
}
// 过滤字符串
function containSpecial(s) {
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\/)(\<)(\>)(\?)(\)]+/);
    return ( containSpecial.test(s) );
}
