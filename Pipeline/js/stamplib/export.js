/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：shp导入
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 **************************************************/
var dataPro;
var datum;

if (!STAMP) {
    var STAMP = {};
}

/**
 * 导入shape文件
 * @param  {[obeject]} usearth        [三维球对象]
 */
STAMP.ExportSHP = function (usearth) {

    var exportSHP = {};
    var latObj;
    /**
     * 导入文件
     * @param  {[string]} shapePath      [shp文件路径]
     * @param  {[string]} spatialRefPath [空间参考文件]
     * @param  {[string]} layerType      [文件类型]
     * @return {[type]}                [description]
     */
    var _importFile = function (shapePath, spatialRefPath, layerType) {
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
        }

        //SHAPE的路径
        var readData = driver.Open(shapePath, 0);
        var layerNum = readData.GetLayerCount();

        //加载空间参考文件(投影变换)
        var spatialRef = dataPro.CoordFactory.CreateSpatialRef();
        spatialRef.InitFromFile(spatialRefPath); //支持如下写法
        datum = dataPro.CoordFactory.CreateDatum();
        datum.init(spatialRef);

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
                        }
                    }

                } else if (type === 1 || type === 401 || type===1025) { //点
                    var point = feature.GetPoint();
                    var rawPoint = TransformPoint(point);
                    var pointAlt = usearth.Measure.MeasureAltitude(rawPoint.X,rawPoint.Y);
                    rawPoint.Z = pointAlt;
                    lonLat = [rawPoint.X, rawPoint.Y];
                }
            }
        }
        usearth.GlobeObserver.FlytoLookat(lonLat[0], lonLat[1], 50, 0, 60, 0, 200, 5);
        latObj = {lon: lonLat[0], lat: lonLat[1]};
        if (v3s && v3s.Count > 0) {
            alert("导入shp成功");
        }
        return v3s;
    }

    var getLocationObj = function () {
        if (latObj) {
            return latObj;
        }
        return null;
    }

    // 对线数据进行空间数据转换
    var transformPolygon = function (poly) {
        var inerLine = poly.GetExteriorRing();
        var wInerLine = transformLinearRing(inerLine);
        var v3s = usearth.Factory.CreateVector3s();
        for (var k = 0; k < wInerLine.length; k++) {
            var v = wInerLine[k];
            var v3 = usearth.Factory.CreateVector3();
            v3.X = v.X;
            v3.Y = v.Y;
            var vAltitude = usearth.Measure.MeasureTerrainAltitude(v.X, v.Y);
            v3.Z = vAltitude;
            v3s.AddVector(v3);
        }
        return v3s;
    }

    var transformLinearRing = function (line) {
        var result = [];
        var pointNum = line.GetPointsCount();
        for (var j = 0; j < pointNum; j++) {
            var point = line.GetPoint(j);
            var rawPoint = TransformPoint(point);
            result.push(rawPoint);
        }

        return result;
    }

    // 对点数据进行空间数据转换 平面转经纬度
    var TransformPoint = function (point) {
        var rawPoint = datum.src_xy_to_des_BLH(point.X, point.Y, 0);
        return rawPoint;
    }
    exportSHP.importFile = _importFile;
    exportSHP.getLocationObj = getLocationObj;
    return exportSHP;
}



