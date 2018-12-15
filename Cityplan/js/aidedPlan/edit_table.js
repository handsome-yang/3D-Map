/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：输入坐标
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var txobj = window.dialogArguments;
earth = txobj.earth;
// 坐标查询
$("#serchL").click(function () {
    var tableObj = $("#textDiv table")[0];
    var selectIndex = tableObj.selectIndex;
    earth.Event.OnCreateGeometry = function (pval) {
        if (pval === null) {
            return;
        }
        tableObj.rows[selectIndex].cells[1].getElementsByTagName('input')(0).value = pval.Longitude.toFixed(8);
        tableObj.rows[selectIndex].cells[2].getElementsByTagName('input')(0).value = pval.Latitude.toFixed(8);
        earth.Event.OnCreateGeometry = function () {
        };
        earth.ShapeCreator.Clear();
    };
    earth.ShapeCreator.CreatePoint();
});

//增加一行
$("#add").click(function () {
    var tableObj = $("#textDiv table")[0];
    var num = tableObj.rows.length - 1;
    var trHtml = getTrHtml(num);
    $("#textDiv table").append(trHtml);
    selectSingleRow($("#textDiv table")[0].rows[$("#textDiv table")[0].rows.length - 1].cells[0]);

});

//删除一行
$("#delete").click(function () {
    var tableObj = $("#textDiv table")[0];
    var selectIndex = tableObj.selectIndex;
    if (tableObj.rows.length === 1) {
        return;
    }
    tableObj.deleteRow(selectIndex);
    for (var i = selectIndex; i < tableObj.rows.length; i++) {
        tableObj.rows[i].cells[0].innerHTML = i;
    }
    $("#delete").attr("disabled", true);
    if (tableObj.rows.length == 1) {
        $("#serchL").attr("disabled", "disabled");
    }
});

//确定点击事件
$("#confirm").click(function () {
    var xyArr = [];
    var tableObj = $("#textDiv table")[0];
    if (tableObj.rows.length < 4) {
        alert("至少添加3行数据，构成多边形");
        return;
    }
    for (var i = 1; i < tableObj.rows.length; i++) {
        if (tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value === "" || tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value === undefined) {
            alert("经度值不能为空！");
           return;
        } else if (tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value === "" || tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value === undefined) {
            alert("纬度值不能为空！");
            tableObj.rows[i].focus();
            return;
        }
        if (isNaN(tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value) || isNaN(tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value)) {
            alert("值必须是数字！");
            tableObj.rows[i].cells[2].focus();
            return;
        }
        var x = tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value;
        var y = tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value;
        x = Math.abs(x);
        y = Math.abs(y);
        if (x > 180 || y > 90) {
            alert("请输入正确的经纬度坐标!");
            return;
        }

        var params = {
            x: tableObj.rows[i].cells[1].getElementsByTagName('input')(0).value,
            y: tableObj.rows[i].cells[2].getElementsByTagName('input')(0).value
        };
        xyArr.push(params);
    }
    window.returnValue = xyArr;
    txobj.functionTag(xyArr);
    window.close();
});

//取消事件
$("#giveup").click(function () {
    window.close();
});

/**
 * 参数：num - 编号
 * 返回：tr标签
 */
var getTrHtml = function (num) {
    var htmlStr = '<tr style="border: 1px double #cdcab8;">';
    htmlStr = htmlStr + '<td onclick="selectSingleRow(this)">' + (num + 1) + '</td>';
    htmlStr = htmlStr + '<td ondblclick="editTd(this)"><input type="text" onkeyup="checkNum(this,false,null)" value=0 style="border: 0px;text-align: center;"></td>';
    htmlStr = htmlStr + '<td ondblclick="editTd(this)"><input type="text" onkeyup="checkNum(this,false,null)" value=0 style="border: 0px;text-align: center;"></td>';
    htmlStr = htmlStr + '</tr>';
    return htmlStr;
};

/**
 * 功能：单行选择表中的某一行
 * 参数：obj - 选择的表单元格对象
 * 返回：无
 */
var selectSingleRow = function (trObj) {
    trObj = trObj.parentNode;
    trObj.blur();
    var tableObj = trObj.parentNode;
    for (var i = 0; i < tableObj.rows.length; i++) {
        tableObj.rows[i].style.color = "#000000";
        tableObj.rows[i].style.backgroundColor = "transparent";
    }
    trObj.style.color = "#ffffff";
    trObj.style.backgroundColor = "#316ac5";
    tableObj.parentNode.selectIndex = trObj.rowIndex;
    $("#delete").removeAttr("disabled");
    $("#serchL").removeAttr("disabled");
};

/**
 * 功能：单行选择表中的某一td
 * 参数：obj - 选择的表td对象
 * 返回：无
 */
var editTd = function (tdObj) {
    tdObj.focus();
    tdObj.parentNode.style.color = "";
    tdObj.parentNode.style.backgroundColor = "";
};