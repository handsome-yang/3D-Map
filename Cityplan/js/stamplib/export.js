/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月15日
 * 描    述：导入导出shp
 * 注意事项：导入导出shp封装方法
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */
var dataPro;
var datum;

if (!STAMP) {
    var STAMP = {};
}

/**
 * 导出shape文件
 * @param  {[type]} usearth        [description]
 * @param  {[type]} savePath       [description]
 * @param  {[type]} spatialRefPath [description]
 * @return {[type]}                [description]
 */
STAMP.ExportSHP = function(usearth, savePath, spatialRefPath, coordinates, type) {
    var exportSHP = {};
    var latObj;
    var filename = "MyPlace";

    /**
     * 导出shape
     * @return {[type]} [description]
     */
    var _exportFileToShape = function() {
        var fileNameTemp = savePath.split("\\");
        var tempA = fileNameTemp[fileNameTemp.length - 1];

        //载入数据处理对象
        dataPro = document.getElementById("dataProcess");
        dataPro.Load();

        //加载空间参考文件(投影变换)
        var spatialRef = dataPro.CoordFactory.CreateSpatialRef();
        spatialRef.InitFromFile(spatialRefPath);
        datum = dataPro.CoordFactory.CreateDatum();
        datum.init(spatialRef);

        //获取创建对象 传入要保存的文件位置
        var folderStr = savePath.slice(0, savePath.lastIndexOf("\\"));
        var writeData = getWriteDataSource(folderStr);

        //创建空间参考
        var spatialReference = dataPro.OGRDataProcess.OGRFactory.CreateOGRSpatialReference();
        var wkt = "PROJCS[\"Xian_1980_3_Degree_GK_CM_120E\",GEOGCS[\"GCS_Xian_1980\",DATUM[\"Xian_1980\",SPHEROID[\"Xian_1980\",6378140.0,298.257]],PRIMEM[\"Greenwich\",0.0],UNIT[\"Degree\",0.0174532925199433]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"False_Easting\",500000.0],PARAMETER[\"False_Northing\",0.0],PARAMETER[\"Central_Meridian\",120.0],PARAMETER[\"Scale_Factor\",1.0],PARAMETER[\"Latitude_Of_Origin\",0.0],UNIT[\"Meter\",1.0]]";
        spatialReference.ImportFromWkt(wkt);

        //创建layer
        var layer;
        if (type === 211) {
            layer = writeData.CreateLayer(tempA, spatialReference, 3);
        } else if (type === 220) {
            layer = writeData.CreateLayer(tempA, spatialReference, 2);
        }

        var attributes = [];
        attributes.push({
            key: "GUID",
            value: "1234-5678-90",
            type: 4
        }, {
            key: "name",
            value: "北京",
            type: 4
        }, {
            key: "height",
            value: 10.0,
            type: 0
        });
        //给layer赋字段值
        var fields = addFieldToLayer(layer, attributes);

        //创建feature 并把layer的字段赋给Feature
        if (coordinates instanceof Array) {
            createFeatures(layer, coordinates, attributes, fields, type);
        } else {
            var feature = createFeature(coordinates, attributes, fields);
            layer.SetFeature(feature);
        }
        //保存到本地shape文件
        layer.SyncToDisk();
        dataPro.Suicide();
        alert("数据导出成功!");
        $("#exportShape").attr("disabled", false);
        $("#clear").attr("disabled", false);
        $("#saveLinePath").val("");
        $("#savePolygonPath").val("");
    }

    /**
     * 导入文件
     * @param  {[type]} shapePath      [description]
     * @param  {[type]} spatialRefPath [description]
     * @param  {[type]} layerType      [description]
     * @return {[type]}                [description]
     */
    var _importFile = function(shapePath, spatialRefPath, layerType, userdata) {
        //载入数据处理对象
        dataPro = document.getElementById("dataProcess");
        dataPro.Load();
        var ogrDataProcess = dataPro.OGRDataProcess;
        //参见接口tagSEOGRRegisterDriverType枚举类型 44 shape 7 dxf 8 dwg
        var driver;
        switch (layerType) {
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
        try{
            var readData = driver.Open(shapePath, 0);
            var layerNum = readData.GetLayerCount();
        }catch (e){
            alert("导入的shp文件不正确");
            $("#selectPath").attr("disabled", false);
            $("#selectImg").attr("disabled", false);
            $("#referenceInput").attr("disabled", false);
            $("#selectSpat").attr("disabled", false);
            $("#importBtn").attr("disabled", false);
            $("#clear").attr("disabled", false);
            return;
        }

        try{
            //加载空间参考文件(投影变换)
            var spatialRef = dataPro.CoordFactory.CreateSpatialRef();
            spatialRef.InitFromFile(spatialRefPath); //支持如下写法
            datum = dataPro.CoordFactory.CreateDatum();
            datum.init(spatialRef);
        }catch (e){
            alert("导入的空间参考文件不正确");
            $("#selectPath").attr("disabled", false);
            $("#selectImg").attr("disabled", false);
            $("#referenceInput").attr("disabled", false);
            $("#selectSpat").attr("disabled", false);
            $("#importBtn").attr("disabled", false);
            $("#clear").attr("disabled", false);
            return;
        }

        var readLayer;
        var lonLat;
        for (var i = 0; i < layerNum; i++) {
            readLayer = readData.GetLayer(i);
            var type = 0;
            var featureNum = readLayer.GetFeatureCount();
            for (var j = 0; j < featureNum; j++) {
                //获取feature
                var feature = readLayer.GetFeature(j);
                type = feature.GetGeometryType();
                //获取feature对应的属性字段
                var featureDefn = feature.GetFeatureDefn();
                type = Number(type.toString(16));
                //获取空间信息
                var v3s;
                var guid = usearth.Factory.CreateGUID();
                var element;
                //判断几何类型 参见SEWkbGeometryType枚举类型
                if (type === 3 || type === 403) { // 面
                    var poly = feature.GetPolygon();
                    v3s = transformPolygon(poly);
                    element = usearth.Factory.CreateElementPolygon(guid, "测试");
                    element.name = "polygon";
                    element.BeginUpdate();
                    element.FillStyle.FillColor = parseInt("0x" + "3200ff00");
                    element.LineStyle.LineColor = parseInt("0x" + "ffffff00");
                    element.SetExteriorRing(v3s);
                    var beginPoint = v3s.Items(0);
                    lonLat = [beginPoint.X, beginPoint.Y, beginPoint.Z];
                } else if (type === 2 || type === 402) { //线
                    var lineString = feature.GetLineString();
                    v3s = transformLinearRing(lineString);
                    var lineVects = usearth.Factory.CreateVector3s();
                    for (var k = 0; k < v3s.length; k++) {
                        var v = v3s[k];
                        var v3 = usearth.Factory.CreateVector3();
                        v3.X = v.X;
                        v3.Y = v.Y;
                        v3.Z = v.Z;
                        lineVects.AddVector(v3);
                        if (k === 0) {
                            lonLat = [v3s[0].X, v3s[0].Y, v3s[0].Z];
                        };
                    }
                    element = usearth.Factory.CreateElementLine(guid, "测试");
                    element.name = "line";
                    element.BeginUpdate();
                    element.LineStyle.LineColor = parseInt("0x" + "ffffff00");
                    element.LineStyle.LineWidth = 1;
                    element.SetPointArray(lineVects);
                }

                if (element) {
                    element.AltitudeType = 1;
                    element.Visibility = true;
                    element.EndUpdate();
                    usearth.AttachObject(element);
                }
            }
        }
        usearth.GlobeObserver.FlytoLookat(lonLat[0], lonLat[1], 50, 0, 60, 0, 200, 5);
        alert("添加成功!");
        $("#selectPath").attr("disabled", false);
        $("#selectImg").attr("disabled", false);
        $("#referenceInput").attr("disabled", false);
        $("#selectSpat").attr("disabled", false);
        $("#importBtn").attr("disabled", false);
        $("#clear").attr("disabled", false);
        latObj = {
            lon: lonLat[0],
            lat: lonLat[1]
        };
    }

    /**
     * 导入文件不保存
     * @param  {[type]} shapePath      [description]
     * @param  {[type]} spatialRefPath [description]
     * @param  {[type]} layerType      [description]
     * @return {[type]}                [description]
     */
    var _importFileNotSave = function(shapePath, spatialRefPath, layerType) {
        //载入数据处理对象
        dataPro = document.getElementById("dataProcess");
        dataPro.Load();
        var ogrDataProcess = dataPro.OGRDataProcess;
        //参见接口tagSEOGRRegisterDriverType枚举类型 44 shape 7 dxf 8 dwg
        var driver;
        switch (layerType) {
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

        try {
            //SHAPE的路径
            var readData = driver.Open(shapePath, 0);
            var layerNum = readData.GetLayerCount();
        }catch (e){
            alert("导入shp文件不正确");
            return;
        }
        try{
            //加载空间参考文件(投影变换)
            var spatialRef = dataPro.CoordFactory.CreateSpatialRef();
            spatialRef.InitFromFile(spatialRefPath); //支持如下写法
            datum = dataPro.CoordFactory.CreateDatum();
            datum.init(spatialRef);
        }catch (e){
            alert("导入空间参考不正确");
            return;
        }

        var readLayer;
        var lonLat;
        for (var i = 0; i < layerNum; i++) {
            readLayer = readData.GetLayer(i);
            var type = 0;
            var featureNum = readLayer.GetFeatureCount();
            for (var j = 0; j < featureNum; j++) {
                //获取feature
                var feature = readLayer.GetFeature(j);
                type = feature.GetGeometryType();
                //获取feature对应的属性字段
                var featureDefn = feature.GetFeatureDefn();
                type = Number(type.toString(16));
                //获取空间信息
                var v3s;
                var guid = usearth.Factory.CreateGUID();
                //判断几何类型 参见SEWkbGeometryType枚举类型
                if (type === 3 || type === 403) { // 面
                    var poly = feature.GetPolygon();
                    v3s = transformPolygon(poly);
                    var beginPoint = v3s.Items(0);
                    lonLat = [beginPoint.X, beginPoint.Y, beginPoint.Z];

                } else if (type === 2 || type === 402) { //线
                    var lineString = feature.GetLineString();
                    v3s = transformLinearRing(lineString);
                    //todo:该处的代码需要优化一下......
                    var lineVects = usearth.Factory.CreateVector3s();
                    for (var k = 0; k < v3s.length; k++) {
                        var v = v3s[k];
                        var v3 = usearth.Factory.CreateVector3();
                        v3.X = v.X;
                        v3.Y = v.Y;
                        v3.Z = v.Z;
                        lineVects.AddVector(v3);
                        if (k === 0) {
                            lonLat = [v3s[0].X, v3s[0].Y, v3s[0].Z];
                        };
                    }
                }
            }
        }
        usearth.GlobeObserver.GotoLookat(lonLat[0], lonLat[1], 50, 0, 60, 0, 200);
        latObj = {
            lon: lonLat[0],
            lat: lonLat[1]
        };
        if(v3s && v3s.Count>0){
            alert("导入shp成功");
        }
        return  v3s;
    }

    /**
     * 得到导入的shp坐标位置
     * @return {[type]} [description]
     */
    var getLocationObj = function() {
        if (latObj) {
            return latObj;
        }
        return null;
    }

    /**
     * 对面数据进行空间数据转换
     * @param  {[type]} poly [polygon矢量面]
     * @return {[type]}      [description]
     */
    var transformPolygon = function(poly) {
        var inerLine = poly.GetExteriorRing();
        var wInerLine = transformLinearRing(inerLine);
        var v3s = usearth.Factory.CreateVector3s();
        for (var k = 0; k < wInerLine.length-1; k++) {
            var v = wInerLine[k];
            var v3 = usearth.Factory.CreateVector3();
            v3.X = v.X;
            v3.Y = v.Y;
            var vAltitude = usearth.Measure.MeasureTerrainAltitude( v.X, v.Y);
            v3.Z = vAltitude;
            v3s.AddVector(v3);
        }
        return v3s;
    }

    /**
     * 对线数据进行空间数据转换
     * @param  {[type]} line [线]
     * @return {[Vector3s]}      [经纬度点集合]
     */
    var transformLinearRing = function(line) {
        var result = [];
        var pointNum = line.GetPointsCount();
        for (var j = 0; j < pointNum; j++) {
            var point = line.GetPoint(j);
            var rawPoint = TransformPoint(point);
            result.push(rawPoint);
        }

        return result;
    }

    /**
     * 对点数据进行空间数据转换 平面转经纬度
     * @param {[type]} point [平面坐标点]
     * @return {[Vector3]} [经纬度点]
     */
    var TransformPoint = function(point) {
        var rawPoint = datum.src_xy_to_des_BLH(point.X, point.Y, 0);
        return rawPoint;
    }

    /**
     * 给layer赋属性字段
     * @param {[type]} layer      [description]
     * @param {[type]} attributes [description]
     */
    function addFieldToLayer(layer, attributes) {
        result = [];
        for (var m = 0; m < attributes.length; m++) {
            var field = attributes[m]["key"];
            var fieldDefnWrite1 = dataPro.OGRDataProcess.OGRFactory.CreateSEOGRFieldDefn(field, attributes[m]["type"]);
            layer.CreateField(fieldDefnWrite1);

            result.push(fieldDefnWrite1);
        }
        return result;
    }

    /**
     * 采用OGR接口绘制面
     * @param {[type]}  part    [点集合]
     * @param {[type]}  polygon [面对象]
     * @param {Boolean} isMult  [是否多个面]
     */
    var addRings = function(part, polygon, isMult) {
        var linearRing = dataPro.OGRDataProcess.OGRFactory.CreateOGRLinearRing();
        var vecs = part.split(" ");
        for (var j = 0; j < vecs.length; j++) {
            var v3 = dataPro.OGRDataProcess.OGRFactory.CreateOGRPoint();
            var part = vecs[j].split(",");
            v3.X = part[0];
            v3.Y = part[1];
            v3.Z = part[2];
            var pt = datum.des_BLH_to_src_xy(v3.X, v3.Y, 0);
            linearRing.SetPointOfXYZ(j, pt.X, pt.Y, part[2]); //这里直接保存z值
        }
        //如果有多个part
        if (isMult) {
            var partPolygon = dataPro.OGRDataProcess.OGRFactory.CreateOGRPolygon();
            partPolygon.AddRing(linearRing);
            polygon.AddGeometry(partPolygon);
        } else {
            polygon.AddRing(linearRing);
        }
        return polygon;
    };

    /**
     * 利用OGR接口绘制线
     * @param {[type]} part [点集合]
     * @param {[type]} line [线对象]
     */
    var addLineRings = function(part, line) {
        var vecs = part.split(" ");
        for (var j = 0; j < vecs.length; j++) {
            var v3 = dataPro.OGRDataProcess.OGRFactory.CreateOGRPoint();
            var part = vecs[j].split(",");
            v3.X = part[0];
            v3.Y = part[1];
            v3.Z = part[2];
            var pt = datum.des_BLH_to_src_xy(v3.X, v3.Y, 0);
            line.SetPointOfXYZ(j, pt.X, pt.Y, part[2]);
        }
        return line;
    }

    /**
     * 创建元素对象feature
     * @param  {[type]} layer      [图层]
     * @param  {[type]} vects      [矢量点集合]
     * @param  {[type]} attributes [属性值集合]
     * @param  {[type]} fields     [字段集合]
     * @param  {[type]} type       [类型：211面，220线]
     * @return {[type]}            [description]
     */
    function createFeatures(layer, vects, attributes, fields, type) {
        if (vects instanceof Array) {
            for (var i = vects.length - 1; i >= 0; i--) {
                var name = "feature";
                var ogrDataProcess = dataPro.OGRDataProcess;
                //创建要素属性 从layer中把字段赋值过来
                var featureDefn = ogrDataProcess.OGRFactory.CreateFeatureDefn(name);
                for (var f = 0; f < fields.length; f++) {
                    featureDefn.AddFieldDefn(fields[f]);
                }

                //创建Feature要素(关联要素属性表)
                var feature = ogrDataProcess.OGRFactory.CreateFeature(featureDefn);

                //创建面或者线对象
                if (type === 211) { //面
                    var polygon = dataPro.OGRDataProcess.OGRFactory.CreateOGRPolygon();
                    var part = vects[i];
                    polygon = addRings(part, polygon);
                    feature.SetGeometryDirectly(polygon);
                } else if (type === 220) { //线
                    var line = dataPro.OGRDataProcess.OGRFactory.CreateOGRLineString();
                    var part = vects[i];
                    line = addLineRings(part, line);
                    feature.SetGeometryDirectly(line);
                }

                //给feature的字段赋值
                for (var m = 0; m < attributes.length; m++) {
                    var fieldValue = attributes[m]["value"];
                    var fieldType = attributes[m]["type"];
                    var fieldWrite = dataPro.OGRDataProcess.OGRFactory.CreateOGRField(fieldType); //string
                    if (fieldType === 4) { //string
                        fieldWrite.SetFieldAsString(fieldValue);
                    } else if (fieldType === 0) { //int
                        fieldWrite.SetFieldAsInteger(fieldValue);
                    } else if (fieldType === 2) { //float
                        fieldWrite.SetFieldAsDouble(fieldValue);
                    }

                    feature.SetField(m, fieldWrite);
                }
                layer.SetFeature(feature);
            };
        }
    }

    /**
     * 创建Feaure要素，这里都导出为一个layer
     * @param  {[type]} vects      [点集合]
     * @param  {[type]} attributes [属性值集合]
     * @param  {[type]} fields     [字段集合]
     * @return {[type]}            [创建的要素feature]
     */
    function createFeature(vects, attributes, fields) {
        var name = "feature";
        var ogrDataProcess = dataPro.OGRDataProcess;
        //创建要素属性 从layer中把字段赋值过来
        var featureDefn = ogrDataProcess.OGRFactory.CreateFeatureDefn(name);
        for (var f = 0; f < fields.length; f++) {
            featureDefn.AddFieldDefn(fields[f]);
        }

        //创建Feature要素(关联要素属性表)
        var feature = ogrDataProcess.OGRFactory.CreateFeature(featureDefn);

        var polygon;
        if (vects instanceof Array) {
            //多个面情况 vects传入的为数组类型
            var polygon = dataPro.OGRDataProcess.OGRFactory.CreateOGRMultiPolygon();
            for (var i = vects.length - 1; i >= 0; i--) {
                var part = vects[i];
                polygon = addRings(part, polygon, true);
            };
        } else {
            //只有一个面的情况 vects传入的为字符串类型
            var polygon = dataPro.OGRDataProcess.OGRFactory.CreateOGRPolygon();
            polygon = addRings(vects, polygon);
        }

        //给feature设置polygon(空间对象)
        feature.SetGeometryDirectly(polygon);

        //给feature的字段赋值
        for (var m = 0; m < attributes.length; m++) {
            var fieldValue = attributes[m]["value"];
            var fieldWrite = dataPro.OGRDataProcess.OGRFactory.CreateOGRField(4); //string
            fieldWrite.SetFieldAsString(fieldValue);
            feature.SetField(m, fieldWrite);
        }

        return feature;
    }

    /**
     * 获取写shp文件的接口对象
     * @param  {[type]} path [shp文件路径]
     * @return {[type]}      [description]
     */
    function getWriteDataSource(path) {
        var ogrDataProcess = dataPro.OGRDataProcess;
        var driver = ogrDataProcess.GetDriverByType(44);//44:shp文件
        return driver.CreateDataSource(path);
    }

    exportSHP.exportFileToShape = _exportFileToShape;
    exportSHP.importFile = _importFile;
    exportSHP.importFileNotSave = _importFileNotSave;
    exportSHP.getLocationObj = getLocationObj;
    return exportSHP;
}
