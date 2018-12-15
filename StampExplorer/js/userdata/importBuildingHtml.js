/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月08日
 * 描    述：导入模块
 * 注意事项：该文件方法仅为导入模块使用
 * 遗留bug ：无
 * 修改日期：2017年11月08日
 *****************************************************************/

var earth = "";

function getEarth(earthObj) {
    earth = earthObj;
    var temp = earth.userdata;
    var allFieldAndValue;
    var pathDic = {};
    var analysis = STAMP.Analysis(earth);
    //选择导入文件
    $("#selectVect").click(function() {
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "shape文件(*.shp)|*.shp");
        if (filePath == "") {
            return;
        }
        $("#selectPath").attr("value", filePath);

        //当修改shape文件地址后 select内容同步更新
        var filedSelect = document.getElementById("filed");
        var floorSelect = document.getElementById("floor");
        var filedSelectLen = document.getElementById("filed").options.length;
        for (var i = 0; i < filedSelectLen; i++) {
            filedSelect.options.remove(0);
        }
        var floorSelectLen = document.getElementById("floor").options.length;
        for (var i = 0; i < floorSelectLen; i++) {
            floorSelect.options.remove(0);
        }

        //获取其属性数据
        var dataPro = document.getElementById("dataProcess");
        dataPro.Load();
        var ogrDataProcess = dataPro.OGRDataProcess;
        var pathStr = filePath.split(".");
        var type = pathStr[pathStr.length - 1];
        var driver;
        switch (type) {
            case "shp":
                driver = ogrDataProcess.GetDriverByType(44);
                break;
            case "dwg":
                driver = ogrDataProcess.GetDriverByType(8);
                break;
            case "dxf":
                driver = ogrDataProcess.GetDriverByType(7);
                break;
            default:
                break;
        };

        //SHAPE的路径
        var readData = driver.Open(filePath, 0);
        if (!readData) {
            alert("导入文件不正确！");
            $("#selectPath").val("");
            return;
        }
        var layerNum = readData.GetLayerCount();

        var readLayer;
        //所有的字段名称
        var fieldName = [];
        //类型是数值型的字段名称
        var floorName = [];

        for (var i = 0; i < layerNum; i++) {
            readLayer = readData.GetLayer(i);
            //一个feature便是一条记录
            var feature = readLayer.GetFeature(0);
            //一个记录的所有字段
            var fieldCount = feature.GetFieldCount();
            //字段数目
            for (var i = 0; i < fieldCount; i++) {
                var name = feature.GetFieldDefn(i).name;

                fieldName.push(name);
                var type = feature.GetFieldDefn(i).Type;
                //参见SEOGRFieldType枚举
                if (type === 0) { //int 楼层数目只允许使用整数
                    floorName.push(name);
                }
            };
        }

        //根据字段名称生成几个数组对象 {filed:,value:[]}
        allFieldAndValue = [];
        for (var h = 0; h < fieldName.length; h++) {
            var hName = fieldName[h];
            var obj = {
                key: hName,
                value: []
            };
            allFieldAndValue.push(obj);
        }

        //根据字段要获取该字段的所有字段值
        for (var r = 0; r < fieldName.length; r++) {
            var vField = allFieldAndValue[r]["value"];
            var featureCount = readLayer.GetFeatureCount();
            for (var p = 0; p < featureCount; p++) {
                var feature = readLayer.GetFeature(p);
                //参见SEOGRFieldType枚举
                var fType = feature.GetFeatureDefn().GetFieldDefn(r).type;
                //alert(fType);
                //返回指定索引位置的值
                switch (fType) {
                    case 0: //32位整数
                        vField.push(feature.GetFieldAsInteger(r));
                        break;
                    case 1: //32位整数数组
                        vField.push(feature.GetFieldAsIntegerList(r));
                        break;
                    case 2: //double型浮点数
                        vField.push(feature.GetFieldAsDouble(r));
                        break;
                    case 3: //double型浮点数数组
                        vField.push(feature.GetFieldAsDoubleList(r));
                        break;
                    case 4: //字符串
                        vField.push(feature.GetFieldAsString(r));
                        break;
                    case 5: //字符串数组
                        vField.push(feature.GetFieldAsStringList(r));
                        break;
                    default:
                        break;
                }
            }
        }

        for (var j = 0; j < fieldName.length; j++) {
            var optionName = fieldName[j];
            $("#filed").append("<option value='" + optionName + "'>" + optionName + "</option>");
        };

        for (var j = 0; j < floorName.length; j++) {
            var fName = floorName[j];
            $("#floor").append("<option value='" + fName + "'>" + fName + "</option>");
        };

        if (floorName.length === 0) {
            alert("该文件没有数值型字段!");
        }

        //按钮默认状态设定
        if (floorName.length > 0) {
            $("#filed").removeAttr("disabled");
            $("#floor").removeAttr("disabled");
            $("#floorHeight").removeAttr("disabled");
        } else {
            $("#filed").attr("disabled", "disabled");
            $("#floor").attr("disabled", "disabled");
            $("#floorHeight").attr("disabled", "disabled");
        }
        if ("" !== $("#referenceInput").val()) {
            $("#btnAdd").removeAttr("disabled");
        }
    });

    //选择投影文件
    $("#addSpatialReference").click(function() {
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "spatial文件(*.spatial)|*.spatial");
        if (filePath == "") {
            return;
        }
        $("#referenceInput").attr("value", filePath);
        if ("" !== $("#selectPath").val()) {
            $("#btnAdd").removeAttr("disabled");
        }
    });

    //导入楼块数据
    var impBuilding;
    var importControl = {};
    $("#btnAdd").click(function() {
        if (check()) {
            var height = $("#floorHeight").val();
            var selectPath = $("#selectPath").val();
            var reference = $("#referenceInput").val();
            var field = $("#filed").val();
            var floor = $("#floor").val();
            $("#selectVect").attr("disabled", true);
            $("#addSpatialReference").attr("disabled", true);
            $("#filed").attr("disabled", true);
            $("#floor").attr("disabled", true);
            $("#floorHeight").attr("disabled", true);
            $("#btnAdd").attr("disabled", true);
            $("#clear").attr("disabled", true);
            if (height > 0 && reference && selectPath && allFieldAndValue) {
                if (impBuilding === undefined || pathDic[selectPath] === undefined) {
                    impBuilding = STAMP.ImportBuilding(earth, selectPath, reference, field, floor, height, allFieldAndValue);
                } else {
                    impBuilding = pathDic[selectPath];
                }
                impBuilding.importFile(field, floor, height, temp);

            } else {
                alert("参数设置有误!");
            }

            pathDic[selectPath] = impBuilding;
            var locatc = impBuilding.getLocationObj();
            if (locatc != null) {
                importControl[selectPath] = locatc;
            }
        }
    });
    $("#clear").click(function() {
        analysis.clearHtmlBallon(earth.htmlBallon);
    });
}
// 控制输入值范围
function check() {
    var selectPath = document.getElementById("selectPath").value;
    if ("" == selectPath) {
        alert("请选择文件！");
        return false;
    }
    var referenceInput = document.getElementById("referenceInput").value;
    if ("" == referenceInput) {
        alert("请选择投影文件！");
        return false;
    }
    var floorHeight = document.getElementById("floorHeight").value;
    if ("" == floorHeight) {
        alert("请输入楼层高度！");
        document.getElementById("floorHeight").focus()
        return false;
    }
    if (isNaN(floorHeight)) {
        alert("楼层高度必须是数字！");
        document.getElementById("floorHeight").focus()
        return false;
    }
    if (floorHeight <= 0) {
        alert("楼层高度不能小于1！");
        document.getElementById("floorHeight").focus()
        return false;
    }
    return true;
}