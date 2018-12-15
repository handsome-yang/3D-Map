/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：线缓冲
 * 注意事项：该文件方法仅为线缓冲使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/
function bufferSubmit() {
    var leftRadiusValue = document.getElementById("leftRadiusValue");
    if (checkBuffer(leftRadiusValue)) {
        var mySelect = document.getElementById("bufferStyle");
        var index = mySelect.selectedIndex;

        var resultVelue = {
            bufferStyle: mySelect.options[index].value,
            leftRadius: leftRadiusValue.value
        };
        window.returnValue = resultVelue;
        window.close();
    }
}

function checkBuffer(leftRadiusValue) {
    if ("" == leftRadiusValue.value) {
        alert("请输入半径！");
        leftRadiusValue.focus();
        return false;
    }
    if (isNaN(leftRadiusValue.value) || leftRadiusValue.value < 0) {
        alert("半径输入不正确！");
        leftRadiusValue.focus();
        return false;
    }
    return true;
}

function closeWindow() {
    window.returnValue = false;
    window.close();
}
