/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：动态特性修改名称
 * 注意事项：该文件方法仅为动态特性修改名称使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/
var isSubmit = false;
var param;

//确定
function setTrackName() {
    isSubmit = true;
    if (document.getElementById("trackName").value === "") {
        alert("请输入名称！");
        document.getElementById("trackName").focus();
        return;
    }
    if (containSpecial(document.getElementById("trackName").value)) {
        alert("名称不能有特殊字符！");
        document.getElementById("trackName").focus();
        return;
    }
    param.name = document.getElementById("trackName").value;
    param.click = "true";
    window.returnValue = param;
    window.close();
}

//初始化
function init() {
    param = window.dialogArguments;
    if (param && param.name) {
        document.getElementById("trackName").value = param.name;
    }
}

//取消
function closeWindow() {
    param.click = "false";
    isSubmit = false;
    window.returnValue = param;
    window.close();
}

//卸载
function unloadWindow() {
    if (!isSubmit) {
        param.click = "false";
        window.returnValue = param;
    }
}
function containSpecial(s) {
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/);
    return ( containSpecial.test(s) );
}