/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：符号标注以及创建
 * 注意事项：该文件方法仅为符号标注使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/
var userdataObj = window.dialogArguments;//窗口外部传进来的对象
var earth = userdataObj.earth;//三维球
var iconNormalFileName = "";//标注图片文件名
var iconSelectedFileName = "";
var isSubmit = false;//是否点击确定

function point_submit() {
    isSubmit = true;
    if (check()) {
        userdataObj.click = "true";
        userdataObj.name = document.getElementById("pointName").value;
        if (document.getElementById("pointName").value === "") {
            userdataObj.name = " ";
        }
        userdataObj.desc = document.getElementById("description").value;
        var iconNormalFileName = document.getElementById("iconNormalValue").value;
        if (document.getElementById("iconNormalValue").value === "") {
            iconNormalFileName = " ";
        }
        var iconSelectedFileName = document.getElementById("iconSelectedValue").value;
        if (document.getElementById("iconSelectedValue").value === "") {
            iconSelectedFileName = " ";
        }

        var dataProcess = document.getElementById("dataProcess"); //将图片格式转换成规定格式并保存到model下
        dataProcess.Load();
        var iconpath = iconNormalFileName.split(".");
        var iconpath1 = iconSelectedFileName.split(".");
        if (iconNormalFileName != null && iconNormalFileName != "" && iconpath[iconpath.length - 1] != "dds" && iconpath[iconpath.length - 1] != "DDS") {
            var texttrue = iconNormalFileName.split("\\");
            var texttrueFname = texttrue[texttrue.length - 1];
            var rootpath = userdataObj.earth.RootPath + STAMP_config.constants.USERDATA + texttrueFname;
            dataProcess.DataConvert.Convert_File(iconNormalFileName, rootpath);
            iconNormalFileName = rootpath;
        }
        if (iconSelectedFileName != null && iconSelectedFileName != "" && iconpath1[iconpath1.length - 1] != "dds" && iconpath1[iconpath1.length - 1] != "DDS") {
            var texttrue = iconSelectedFileName.split("\\");
            var texttrueFname = texttrue[texttrue.length - 1];
            var rootpath = userdataObj.earth.RootPath + STAMP_config.constants.USERDATA + texttrueFname;
            dataProcess.DataConvert.Convert_File(iconSelectedFileName, rootpath);
            iconSelectedFileName = rootpath;
        }

        userdataObj.iconNormalFileName = iconNormalFileName;
        userdataObj.iconSelectedFileName = iconSelectedFileName;

        var transparency = parseInt(255).toString(16);
        var textColor = document.getElementById("textColor").value;
        textColor = textColor.substring(1);
        userdataObj.textColor = "#" + transparency + textColor;

        userdataObj.textHorizontalScale = document.getElementById("textHorizontalScale").value;
        userdataObj.textVerticalScale = document.getElementById("textHorizontalScale").value;
        userdataObj.showHandle = document.getElementById("showHandle").value;
        userdataObj.handleHeight = document.getElementById("handleHeight").value;

        var handleColor = document.getElementById("handleColor").value;
        handleColor = handleColor.substring(1);
        userdataObj.handleColor = "#" + transparency + handleColor;

        userdataObj.minVisibleRange = document.getElementById("MinVisibleRange").value;
        userdataObj.maxVisibleRange = document.getElementById("MaxVisibleRange").value;
        userdataObj.selectable = document.getElementById("selectable").value;
        userdataObj.editable = document.getElementById("editable").value;

        window.close();
    }
}
// 判断输入值是否合法
function check() {
    if ("" == document.getElementById("pointName").value && "" == document.getElementById("iconNormalValue").value) {
        alert("Point名称和图标不能都为空!");
        document.getElementById("pointName").focus();
        return false;
    }
    if ("" != document.getElementById("pointName").value) {
        if (containSpecial(document.getElementById("pointName").value)) {
            alert("名称不能有特殊字符！");
            document.getElementById("pointName").focus();
            return false;
        }
    }
    if ("" == document.getElementById("textHorizontalScale").value) {
        alert("文字比例不能为空!");
        document.getElementById("textHorizontalScale").focus();
        return false;
    }
    if (isNaN(document.getElementById("textHorizontalScale").value) == true) {
        alert("文字比例输入不正确!");
        document.getElementById("textHorizontalScale").focus();
        return false;
    }
    if ("" == document.getElementById("handleHeight").value) {
        alert("指示线长度不能为空!");
        document.getElementById("handleHeight").focus();
        return false;
    }
    if (isNaN(document.getElementById("handleHeight").value) == true) {
        alert("指示线长度输入不正确!");
        document.getElementById("handleHeight").focus();
        return false;
    }
    if ("" == document.getElementById("MinVisibleRange").value) {
        alert("可视范围不能为空!");
        document.getElementById("MinVisibleRange").focus();
        return false;
    }
    if (isNaN(document.getElementById("MinVisibleRange").value) == true) {
        alert("可视范围输入不正确!");
        document.getElementById("MinVisibleRange").focus();
        return false;
    }
    if (document.getElementById("MinVisibleRange").value < 0) {
        alert("可视范围输入不正确!");
        document.getElementById("MinVisibleRange").focus();
        return false;
    }
    if ("" == document.getElementById("MaxVisibleRange").value) {
        alert("可视范围不能为空!");
        document.getElementById("MaxVisibleRange").focus();
        return false;
    }
    if (isNaN(document.getElementById("MaxVisibleRange").value) == true) {
        alert("可视范围输入不正确!");
        document.getElementById("MaxVisibleRange").focus();
        return false;
    }
    if (document.getElementById("MaxVisibleRange").value < 0) {
        alert("可视范围输入不正确!");
        document.getElementById("MaxVisibleRange").focus();
        return false;
    }
    return true;
}

var iconPath;

function attribute() {
    var nodeObj;
    iconPath = earth.Environment.RootPath;
    if (!userdataObj.iconName) {
        iconNormalFileName = iconPath + "icon" + "\\" + "icon.png";
        iconSelectedFileName = iconPath + "icon" + "\\" + "icon.png";
    }
    document.getElementById("iconNormalValue").value = iconNormalFileName;
    document.getElementById("iconSelectedValue").value = iconSelectedFileName;

    if ("add" == userdataObj.action) {
        return;
    } else if ("edit" == userdataObj.action) {
        document.getElementById("pointName").value = userdataObj.name;
        document.getElementById("description").value = userdataObj.desc;
        document.getElementById("iconNormalValue").value = userdataObj.iconNormalFileName;
        document.getElementById("iconSelectedValue").value = userdataObj.iconSelectedFileName;

        if (userdataObj.textColor) {
            var textColor = userdataObj.textColor.substring(3);
            document.getElementById("textColor").value = "#" + textColor;
            document.getElementById("SelectedColor").style.background = "#" + textColor;
        };

        document.getElementById("textHorizontalScale").value = userdataObj.textHorizontalScale;
        document.getElementById("textHorizontalScale").value = userdataObj.textVerticalScale;
        document.getElementById("showHandle").value = userdataObj.showHandle;
        document.getElementById("handleHeight").value = userdataObj.handleHeight;

        var handleColor = userdataObj.handleColor.substring(3);
        document.getElementById("handleColor").value = "#" + handleColor;
        document.getElementById("SelectedLinecolor").style.background = "#" + handleColor;

        document.getElementById("MinVisibleRange").value = userdataObj.minVisibleRange;
        document.getElementById("MaxVisibleRange").value = userdataObj.maxVisibleRange;
        document.getElementById("selectable").value = userdataObj.selectable;
        if (userdataObj.selectable.toString() == "true") {
            document.getElementById("selectable").selectedIndex = 0;
        } else {
            document.getElementById("selectable").selectedIndex = 1;
            document.getElementById("editable").disabled = true;
        }
        document.getElementById("editable").value = userdataObj.editable;
        if (userdataObj.editable.toString() == "true") {
            document.getElementById("editable").selectedIndex = 0;
        } else {
            document.getElementById("editable").selectedIndex = 1;
        }


        if (userdataObj.showHandle == true) {
            document.getElementById("handleHeight").disabled = false;
            document.getElementById("handleColor").disabled = false;
            document.getElementById("SelectedLinecolor").disabled = false;
        }
        if (userdataObj.selectable == false) {
            document.getElementById("editable").disabled = true;
        }

    }
    editablesel();
}

var iconObj = new Object();
// 图标选取
function addIcon(ioco) {
    var path = iconPath + "icon/";

    iconObj.icon_path = path;
    iconObj.icon_name = userdataObj.iconName;
    iconObj.allIcons = userdataObj.allIcons;

    var filePath = userdataObj.earth.UserDocument.OpenFileDialog(userdataObj.earth.RootPath, "所有支持类型|*.BMP;*.JPG;*.JPEG;*.PNG;*.GIF|BMP文件(*.BMP;)|*.BMP;|JPEG文件(*.JPG;*.JPEG)|*.JPG;*.JPEG|PNG文件(*.PNG)|*.PNG|GIF文件(*.GIF)|*.GIF");

    if (filePath == "")
        return;
    var fileType = filePath.substring(filePath.lastIndexOf(".") + 1).toLowerCase();
    if ("jpg" == fileType || "jpeg" == fileType || "png" == fileType || "bmp" == fileType || "gif" == fileType) {
        if ("Normal" == ioco.id) {
            document.getElementById("iconNormalValue").value = filePath;
        } else if ("Selected" == ioco.id) {
            document.getElementById("iconSelectedValue").value = filePath;
        }
    } else {
        alert("支持图片格式为:jpeg,jpg,png,bmp,gif");
    }
}

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
// 对象是否能被选中
function editablesel() {
    if (document.getElementById("selectable").value == "false") {
        document.getElementById("editable").selectedIndex = 1;
        document.getElementById("editable").disabled = true;
    } else {
        document.getElementById("editable").disabled = false;
    }
}

//名称变化引起的前端控制以及前端控制名称输入
function valChange(thisObj) {
    checkStr(thisObj);
    if ("" == document.getElementById("pointName").value) {
        document.getElementById("textColor").disabled = true;
        document.getElementById("SelectedColor").disabled = true;
        document.getElementById("textHorizontalScale").disabled = true;
    } else {
        document.getElementById("textColor").disabled = false;
        document.getElementById("SelectedColor").disabled = false;
        document.getElementById("textHorizontalScale").disabled = false;
    }
}

//验证是否有特殊字符
function containSpecial(s) {
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\/)(\<)(\>)(\?)(\)]+/);
    return (containSpecial.test(s));
}

function slectChangeAboutShowLine(e) {
    var confirmStr = document.getElementById("showHandle").value;
    if (confirmStr == "true") {
        document.getElementById("handleHeight").removeAttribute("disabled");
        document.getElementById("SelectedLinecolor").removeAttribute("disabled");
        document.getElementById("handleColor").removeAttribute("disabled");
    } else {
        document.getElementById("handleHeight").disabled = true;
        document.getElementById("SelectedLinecolor").disabled = true;
        document.getElementById("handleColor").disabled = true;
    }
}
