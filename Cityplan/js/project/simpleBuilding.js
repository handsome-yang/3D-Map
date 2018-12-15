/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：简单建筑
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var userdataObj = window.dialogArguments;
var earth = userdataObj.earth;
var isSubmit = false;

function building_submit() {
    isSubmit = true;
    if (check()) {
        if (userdataObj != null) {
            userdataObj.click = "true";
            userdataObj.desc = "";
            userdataObj.name = document.getElementById("buildingName").value;
            var floorHeight = document.getElementById("floorHeight").value;
            var floorCount = document.getElementById("floorCount").value;
            userdataObj.floorHeight = floorHeight;
            userdataObj.floorCount = floorCount;
            var floorColor = document.getElementById("floorColor").value.substr(1);
            var floorColorTran = document.getElementById("floorColorTran").value;
            floorColorTran = parseInt(floorColorTran).toString(16);
            if (floorColorTran.length == 1) {
                floorColorTran = "0" + floorColorTran;
            }
            userdataObj.floorColor = "#" + floorColorTran + floorColor;
            var floorTexture = document.getElementById("floorTexture").value;
            userdataObj.roofTypeNode = document.getElementById("roofType").value;

            var roofColor = document.getElementById("roofColor").value.substr(1);
            var roofColorTran = document.getElementById("roofColorTran").value;
            roofColorTran = parseInt(roofColorTran).toString(16);
            if (roofColorTran.length == 1) {
                roofColorTran = "0" + roofColorTran;
            }
            userdataObj.roofColor = "#" + roofColorTran + roofColor;
            var roofTexture = document.getElementById("roofTexture").value;
            var dataProcess = document.getElementById("dataProcess");
            dataProcess.Load();
            if (roofTexture != "") {
                var texttrue = roofTexture.split("\\");
                var texttrueFname = texttrue[texttrue.length - 1];
                var rootpath = userdataObj.earth.RootPath + STAMP_config.constants.USERDATA + texttrueFname;
                var a = dataProcess.DataConvert.Convert_File(roofTexture, rootpath);
                if (a === 1) {
                    roofTexture = roofTexture;
                } else if (a === 0) {
                    roofTexture = rootpath;
                } else if (a === -1) {
                    alert("模型转换没成功！");
                }

            }
            userdataObj.roofTexture = roofTexture;
            if (floorTexture != "") {
                var texttrue = floorTexture.split("\\");
                var texttrueFname = texttrue[texttrue.length - 1];
                var rootpath = userdataObj.earth.RootPath + STAMP_config.constants.USERDATA + texttrueFname;
                var a = dataProcess.DataConvert.Convert_File(floorTexture, rootpath);
                if (a === 1) {
                    floorTexture = floorTexture;
                } else if (a === 0) {
                    floorTexture = rootpath;
                } else if (a === -1) {
                    alert("模型转换没成功！");
                }

            }
            userdataObj.floorTexture = floorTexture;
        }

        window.close();
    }
}

function check() {
    if (buildingName.value == "") {
        alert("名称不能为空!");
        buildingName.focus();
        return false;
    }
    var floorCountObj = document.getElementById("floorCount");
    if ("" == floorCountObj.value) {
        alert("请输入楼层数量！");
        floorCountObj.focus();
        return false;
    }
    if (isNaN(floorCountObj.value)) {
        alert("楼层数量必须是数字！");
        floorCountObj.select();
        floorCountObj.focus();
        return false;
    }
    if (floorCountObj.value <= 0) {
        alert("楼层数量输入不正确！");
        floorCountObj.select();
        floorCountObj.focus();
        return false;
    }
    var floorHeightObj = document.getElementById("floorHeight");
    if ("" == floorHeightObj.value) {
        alert("请输入楼层高度！");
        floorHeightObj.focus();
        return false;
    }
    if (isNaN(floorHeightObj.value)) {
        alert("楼层高度必须是数字！");
        floorHeightObj.select();
        floorHeightObj.focus();
        return false;
    }
    if (floorHeightObj.value <= 0) {
        alert("楼层高度输入不正确！");
        floorHeightObj.select();
        floorHeightObj.focus();
        return false;
    }
    var floorColorObj = document.getElementById("floorColor");
    if ("" == floorColorObj.value) {
        alert("请选择楼层颜色！");
        floorColorObj.focus();
        return false;
    }
    var floorColorTranObj = document.getElementById("floorColorTran");
    if ("" == floorColorTranObj.value) {
        alert("请输入楼层颜色透明度！");
        floorColorTranObj.focus();
        return false;
    }
    if (isNaN(floorColorTranObj.value)) {
        alert("透明度必须是数字！");
        floorColorTranObj.focus();
        return false;
    }
    if (parseInt(floorColorTranObj.value) < 0 || parseInt(floorColorTranObj.value) > 255) {
        alert("楼层颜色透明度超出范围！");
        floorColorTranObj.select();
        floorColorTranObj.focus();
        return false;
    }
    var roofColorObj = document.getElementById("roofColor");
    if ("" == roofColorObj.value) {
        alert("请选择屋顶颜色！");
        roofColorObj.focus();
        return false;
    }
    var roofColorTranObj = document.getElementById("roofColorTran");
    if ("" == roofColorTranObj.value) {
        alert("请输入屋顶颜色透明度！");
        roofColorTranObj.focus();
        return false;
    }
    if (isNaN(roofColorTranObj.value)) {
        alert("透明度必须是数字！");
        roofColorTranObj.focus();
        return false;
    }
    if (parseInt(roofColorTranObj.value) < 0 || parseInt(roofColorTranObj.value) > 255) {
        alert("屋顶颜色透明度超出范围！");
        roofColorTranObj.select();
        roofColorTranObj.focus();
        return false;
    }
    return true;
}
// 保留一位小数，四舍五入
function fomatFloat(src, pos) {
    return Math.round(src * Math.pow(10, pos)) / Math.pow(10, pos);
}
// 获取用户对象属性
function attributeUserdata() {
    if ("add" == userdataObj.action) {
        var floorCount = Math.ceil(userdataObj.floorsAllHeight / parseFloat(document.getElementById("floorHeight").value));
        document.getElementById("floorCount").value = floorCount;
        return;
    } else if ("edit" == userdataObj.action) {
        document.getElementById("buildingName").value = userdataObj.name;
        document.getElementById("floorCount").value = userdataObj.floorCount;
        var fHeight = fomatFloat(userdataObj.floorHeight, 1);
        document.getElementById("floorHeight").value = fHeight;
        document.getElementById("floorTexture").value = userdataObj.floorTexture;
        document.getElementById("roofTexture").value = userdataObj.roofTexture;
        document.getElementById("roofType").value = userdataObj.roofTypeNode;
        var roofColor;
        var roofColorTran;
        roofColor = userdataObj.roofColor;
        var roofColorLen = roofColor.length;
        if (roofColorLen === 3) {
            var colorStr = roofColor.substring(1);
            document.getElementById("roofColor").value = "#" + "0000" + colorStr;
            document.getElementById("roofColorTran").value = 0;
            document.getElementById("roofColorSel").style.background = "#" + "0000" + colorStr;
        } else if (roofColorLen === 5) {
            var colorStr = roofColor.substring(1);
            document.getElementById("roofColor").value = "#" + "00" + colorStr;
            document.getElementById("roofColorTran").value = 0;
            document.getElementById("roofColorSel").style.background = "#" + "00" + colorStr;
        } else if (roofColorLen === 7) { 
            document.getElementById("roofColor").value = roofColor;
            document.getElementById("roofColorTran").value = 0;
            document.getElementById("roofColorSel").style.background = roofColor;
        } else if (roofColorLen === 8) { 
            var colorStr = roofColor.substring(2);
            var HEX = roofColor.substr(1, 1);
            document.getElementById("roofColor").value = "#" + colorStr;
            document.getElementById("roofColorTran").value = parseInt("0x" + HEX);
            document.getElementById("roofColorSel").style.background = "#" + colorStr;
        } else if (roofColorLen === 9) {
            var colorStr = roofColor.substring(3);
            document.getElementById("roofColor").value = "#" + colorStr;
            var HEX = roofColor.substr(1, 2);
            document.getElementById("roofColorTran").value = parseInt("0x" + HEX);
            document.getElementById("roofColorSel").style.background = "#" + colorStr;
        }
        var floorColor;
        var floorColorTran;
        floorColor = userdataObj.floorColor;
        var floorColorLen = floorColor.length;
        if (floorColorLen === 3) {
            var colorStr = floorColor.substring(1);
            document.getElementById("floorColor").value = "#" + "0000" + colorStr;
            document.getElementById("floorColorTran").value = 0;
            document.getElementById("floorColorSel").style.background = "#" + "0000" + colorStr;
        } else if (floorColorLen === 5) {
            var colorStr = floorColor.substring(1);
            document.getElementById("floorColor").value = "#" + "00" + colorStr;
            document.getElementById("floorColorTran").value = 0;
            document.getElementById("floorColorSel").style.background = "#" + "00" + colorStr;
        } else if (floorColorLen === 7) { 
            document.getElementById("floorColor").value = floorColor;
            document.getElementById("floorColorTran").value = 0;
            document.getElementById("floorColorSel").style.background = floorColor;
        } else if (floorColorLen === 8) { 
            var colorStr = floorColor.substring(2);
            var HEX = floorColor.substr(1, 1);
            document.getElementById("floorColor").value = "#" + colorStr;
            document.getElementById("floorColorTran").value = parseInt("0x" + HEX);
            document.getElementById("floorColorSel").style.background = "#" + colorStr;
        } else if (floorColorLen === 9) {
            var colorStr = floorColor.substring(3);
            document.getElementById("floorColor").value = "#" + colorStr;
            var HEX = floorColor.substr(1, 2);
            document.getElementById("floorColorTran").value = parseInt("0x" + HEX);
            document.getElementById("floorColorSel").style.background = "#" + colorStr;
        }
    }
}

var sInitColor = null;
// 修改颜色
function fillColorDlg(colorFieldId) {
    var sColor = null;
    if (colorFieldId == "floorColor") {
        sInitColor = document.getElementById("floorColor").value;
    } else {
        sInitColor = document.getElementById("roofColor").value;
    }
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
    sColor = "#" + sColor;
    document.getElementById(colorFieldId).value = sColor;
    if (colorFieldId == "floorColor") {
        document.getElementById("floorColorSel").style.background = sColor;
    } else {
        document.getElementById("roofColorSel").style.background = sColor;
    }
    sInitColor = sColor;
}

/**
 * 添加材质
 */
function addLink(textureFieldId) {
    var fileName = earth.UserDocument.openFileDialog(earth.Environment.RootPath, "所有支持类型|*.BMP;*.DIB;*.JPG;*.JPEG;*.PNG;*.TIF;*.TIFF;*.GIF|BMP文件(*.BMP;*.DIB)|*.BMP;*.DIB|JPEG文件(*.JPG;*.JPEG)|*.JPG;*.JPEG|PNG文件(*.PNG)|*.PNG");
    if (fileName == "")
        return;
    var fileType = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    if ("jpg" == fileType || "jpeg" == fileType || "png" == fileType || "bmp" == fileType || "gif" == fileType) {
        document.getElementById(textureFieldId).value = fileName;
    } else {
        alert("支持图片格式为:jpeg,jpg,png,bmp,gif");
    }
}

function closeWindow() {
    isSubmit = false;
    userdataObj.click = "false";
    window.close();
}

function unloadBuildingWindow() {
    if (!isSubmit) {
        userdataObj.click = "false";
    }
}
