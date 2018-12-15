/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：添加楼块
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var userdataObj = window.dialogArguments;
var isSubmit = false;

function polygon_submit() {
    isSubmit = true;
    if (check()) {
        returnValue();
        window.close();
    }
}
// 返回子窗口对象
function returnValue() {
    if (userdataObj != null) {
        userdataObj.click = "true";
        var name = document.getElementById("lineRingName").value;
        var floorCount = document.getElementById("floorCount").value;
        var floorHeight = document.getElementById("floorHeight").value;
        userdataObj.name = name;
        userdataObj.floorCount = floorCount;
        userdataObj.floorHeight = floorHeight;
        var textruePathArr = [];
        var textrue0 = document.getElementById("texture0").value;
        var textrue1 = document.getElementById("texture1").value;
        var textrue2 = document.getElementById("texture2").value;
        var dataProcess = document.getElementById("dataProcess");
        //将图片格式转换成规定格式并保存到temp/picture下面
        dataProcess.Load();
        if (textrue0 != null && textrue0 != "") {
            var texttrue = textrue0.split("\\");
            var texttrueFname = texttrue[texttrue.length - 1];
            var rootpath = userdataObj.earth.RootPath + STAMP_config.constants.USERDATA + texttrueFname;
            var a = dataProcess.DataConvert.Convert_File(textrue0, rootpath);
            if (a === 1) {
                textrue0 = textrue0;
            } else if (a === 0) {
                textrue0 = rootpath;
            } else if (a === -1) {
                alert("模型转换没成功！");
                return;
            }
            textrue0 = rootpath;
        }

        if (textrue1 != null && textrue1 != "") {
            var texttrue = textrue1.split("\\");
            var texttrueFname = texttrue[texttrue.length - 1];
            var rootpath = userdataObj.earth.RootPath + STAMP_config.constants.USERDATA + texttrueFname;
            var a = dataProcess.DataConvert.Convert_File(textrue1, rootpath);
            if (a === 1) {
                textrue1 = textrue1;
            } else if (a === 0) {
                textrue1 = rootpath;
            } else if (a === -1) {
                alert("模型转换没成功！");
                return;
            }
        }

        if (textrue2 != null && textrue2 != "") {
            var texttrue = textrue2.split("\\");
            var texttrueFname = texttrue[texttrue.length - 1];
            var rootpath = userdataObj.earth.RootPath + STAMP_config.constants.USERDATA + texttrueFname;
            var a = dataProcess.DataConvert.Convert_File(textrue2, rootpath);
            if (a === 1) {
                textrue2 = textrue2;
            } else if (a === 0) {
                textrue2 = rootpath;
            } else if (a === -1) {
                alert("模型转换没成功！");
                return;
            }
        }

        textruePathArr.push(textrue0);
        textruePathArr.push(textrue1);
        textruePathArr.push(textrue2);

        userdataObj.texturePath = textruePathArr;
        var transparency = document.getElementById("transparency").value;
        transparency = parseInt(transparency).toString(16); //parseInt(x,16);
        if (transparency.length == 1) {
            transparency = "0" + transparency;
        }

        var fillColor = document.getElementById("fillColor").value;
        fillColor = fillColor.substring(1);
        userdataObj.fillcolor = "#" + transparency + fillColor;

        if (userdataObj.type === 205 || userdataObj.type === 206) {
            userdataObj.sides = document.getElementById("sides").value;
        }
    }
    return userdataObj;
}

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
    return true;
}
// 初始化用户数据
function attributeUserdata() {
    var floorCount = Math.ceil(userdataObj.floorsAllHeight / parseFloat(document.getElementById("floorHeight").value));
    document.getElementById("floorCount").value = floorCount;
    document.getElementById("lineRingName").value = userdataObj.name;
}

var sInitColor = null;
// 楼快颜色
function fillColorDlg() {
    var sColor = null;
    sInitColor = document.getElementById("fillColor").value;
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
    document.getElementById("fillColor").value = sColor;
    document.getElementById("fillColorSel").style.background = sColor;
    sInitColor = sColor;
}

/**
 * 添加材质
 */
function addLink(textId, hz) {
    var filePath = userdataObj.earth.UserDocument.OpenFileDialog(userdataObj.earth.RootPath, "所有支持类型|*.BMP;*.DIB;*.JPG;*.JPEG;*.PNG;*.TIF;*.TIFF;*.GIF|BMP文件(*.BMP;*.DIB)|*.BMP;*.DIB|JPEG文件(*.JPG;*.JPEG)|*.JPG;*.JPEG|PNG文件(*.PNG)|*.PNG");
    if (filePath == "") return;
    var fileType = filePath.substring(filePath.lastIndexOf(".") + 1).toLowerCase();
    if ("jpg" == fileType || "jpeg" == fileType || "png" == fileType || "bmp" == fileType || "gif" == fileType) {
        document.getElementById(textId).value = filePath;
    } else {
        alert("支持图片格式为:jpeg,jpg,png,bmp,gif");
    }
}

function closeWindow() {
    isSubmit = false;
    userdataObj.click = "false";
    window.close();
}

function unload3DWindow() {
    if (!isSubmit) {
        userdataObj.click = "false";
    }
}

function containSpecial(s) {
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/);
    return (containSpecial.test(s));
}