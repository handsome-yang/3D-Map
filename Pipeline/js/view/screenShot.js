/**
 * 作    者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描    述：屏幕截图相关功能
 * 注意事项：
 * 遗留bug ：0
 * 修改日期：2017年11月7日
 ******************************************/
var earth = ""; //全局earth
/**
 * 检查输入项
 */
function check() {
    if (path.value == "") {
        alert("请选择存储路径");
        path.focus();
        return false;
    }
    return true;
}

/**
 * 是否包含特殊字符
 * @param {Object} s 输入字符
 */
function containSpecial(s) {
    var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/);
    return (containSpecial.test(s));
}

/**
 * 气泡内部驱动脚本执行
 * @param {Object} earthObj  三维球对象
 */
function setTranScroll(earthObj) {
    earth = earthObj;
    $("#width").val(earth.clientWidth);
    $("#height").val(earth.clientHeight);
    $("#btn_select_sector").click(function () {
        var path = $("#path").val();
        if (check()) {
            if (path) {
                $("#clear").attr("disabled", true);
                var shotWay = $("#shotWay").val();
                shotWay = parseFloat(shotWay).toFixed(2);
                earth.ScreenShot(path, shotWay); //修改后的截图接口
                $("#path").val("");
                $("#btn_select_sector").attr("disabled", true);
            }
            $("#clear").attr("disabled", false);
        }
    });
    /**
     * 选取文件点击事件
     */
    $("#select").click(function () {
        var path = earth.UserDocument.SaveFileDialog("", "*.jpg|*.JPG", "jpg");
        if (!path) {
            return;
        }
        var filename = path.substring(path.lastIndexOf("\\") + 1, path.lastIndexOf("."));
        if (containSpecial(filename)) {
            alert("名称不能有特殊字符！");
            return;
        }
        $("#path").val(path);
        if ("" != $("#path").val() && "" != $("#shotWay").val()) {
            $("#btn_select_sector").attr("disabled", false);
        }
    });
    /**
     * 退出点击事件
     */
    $("#clear").click(function () {
        if (earth.htmlBallon != null) {
            earth.htmlBallon.DestroyObject();
            earth.htmlBallon = null;
        }
    });

    /**
     * 放大倍数输入项检查
     */
    $("#shotWay").blur(function () {
        var value = $(this).val();
        if ("0" === value || "0." === value || "0.0" === value || "0.00" === value) { //最小值为0.01  范围介于0.01-10
            $(this).val(0.01);
        }
        if ("" === value) { //不输入则重新置为默认值
            $(this).val(1);
        }
    });

    /**
     * 获取视窗宽高
     */
    $("#getHeightWidth").click(function () {
        $("#width").val(earth.clientWidth);
        $("#height").val(earth.clientHeight);
    });
}