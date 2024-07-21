const smallId = "#small_dropzone";
const smallDropzone = document.querySelector(smallId);

var smallPreviewNode = smallDropzone.querySelector(".dropzone-item");
smallPreviewNode.id = "";
var smallPreviewTemplate = smallPreviewNode.parentNode.innerHTML;
smallPreviewNode.parentNode.removeChild(smallPreviewNode);

let smallAlertDisplayed = false;

const downloadButton = document.querySelector(".btn-download");

let staticLopMon = null;
let staticSinhVien = null;
let staticLop = null;

downloadButton.style.display = "none";

const smallMyDropzone = new Dropzone(smallId, {
  url: "/",
  method: "get",
  parallelUploads: 20,
  maxFilesize: 10000,
  maxFiles: 100,
  acceptedFiles: ".xlsx, .csv",
  previewTemplate: smallPreviewTemplate,
  previewsContainer: smallId + " .dropzone-items",
  clickable: smallId + " .dropzone-select",
});

let uploadedFiles = [];
smallMyDropzone.on("addedfile", function (file) {
  uploadedFiles.push(file);
  const smallDropzoneItems = smallDropzone.querySelectorAll(".dropzone-item");
  smallDropzoneItems.forEach((dropzoneItem) => {
    dropzoneItem.style.display = "";
  });
  downloadButton.style.display = "block";
});

// Update the total progress bar
smallMyDropzone.on("totaluploadprogress", function (progress) {
  const smallProgressBars = smallDropzone.querySelectorAll(".progress-bar");
  smallProgressBars.forEach((progressBar) => {
    progressBar.style.width = progress + "%";
  });
});

smallMyDropzone.on("sending", function (file) {
  const smallProgressBars = smallDropzone.querySelectorAll(".progress-bar");
  smallProgressBars.forEach((progressBar) => {
    progressBar.style.opacity = "1";
  });
});

smallMyDropzone.on("complete", function (progress) {
  const smallProgressBars = smallDropzone.querySelectorAll(".dz-complete");

  setTimeout(function () {
    smallProgressBars.forEach((progressBar) => {
      progressBar.querySelector(".progress-bar").style.opacity = "0";
      progressBar.querySelector(".progress").style.opacity = "0";
    });
  }, 300);
});

smallMyDropzone.on("maxfilesexceeded", function (file) {
  smallMyDropzone.removeFile(file);
  if (!smallAlertDisplayed) {
    createToast(
      "error",
      "bi bi-exclamation-circle",
      "Error",
      "You can only upload a maximum of 4 Excel files."
    );
    smallAlertDisplayed = true;
  }
});

smallMyDropzone.on("removedfile", function (file) {
  uploadedFiles = uploadedFiles.filter((f) => f !== file); // Xóa file khỏi mảng
  if (uploadedFiles.length === 0) {
    downloadButton.style.display = "none"; // Ẩn nút download nếu không còn file nào
  }
  if (smallMyDropzone.files.length < smallMyDropzone.options.maxFiles) {
    smallAlertDisplayed = false;
  }
});

downloadButton.addEventListener("click", async function () {
  for (const file of uploadedFiles) {
    await processFile(file);
  }
});

function clearFiles() {
  smallMyDropzone.removeAllFiles(true);
}

document
  .querySelector(smallId + " .dropzone-remove-all")
  .addEventListener("click", function () {
    smallMyDropzone.removeAllFiles(true);
    smallAlertDisplayed = false;
    setTimeout(() => {
      resetSmallCheckboxes();
    }, 0);
  });

let dataHandler = [];
let dataSinhVien, dataLop, dataLopMon, dataTienDo;
let staticDataLopMon = null;
let staticTienDo = null;

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};
let name_file = null;
async function processFile(files) {
  dataHandler = [];
  try {
    name_file = files.name;
    const jsonData = await readFile(files);
    if (!checkMatch(jsonData[0], header_cms)) return;

    const db = await openDatabase();
    const transaction = db.transaction(
      ["lopMonStore", "lopStore", "tienDoStore", "sinhVienStore"],
      "readonly"
    );

    const objectStoreLopMon = transaction.objectStore("lopMonStore");
    const objectStoreLop = transaction.objectStore("lopStore");
    const objectStoreTienDo = transaction.objectStore("tienDoStore");
    const objectStoreSinhVien = transaction.objectStore("sinhVienStore");

    const dataSinhVien = await getDataFromObjectStore(objectStoreSinhVien);
    const dataLopMon = await getDataFromObjectStore(objectStoreLopMon);
    const dataLop = await getDataFromObjectStore(objectStoreLop);
    const dataTienDo = await getDataFromObjectStore(objectStoreTienDo);
    staticDataLopMon = dataLopMon;
    staticSinhVien = dataSinhVien;
    staticLop = dataLop;
    staticTienDo = dataTienDo;
    processData(dataSinhVien, dataLopMon, dataLop, dataTienDo, jsonData);
  } catch (error) {
    console.error("Error:", error);
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open("fpt-tool", 1);
    request.onerror = reject;
    request.onsuccess = (event) => resolve(event.target.result);
  });
}

function getDataFromObjectStore(objectStore) {
  return new Promise((resolve, reject) => {
    const request = objectStore.getAll();
    request.onerror = reject;
    request.onsuccess = (event) => resolve(event.target.result);
  });
}

function splitClassName(className) {
  const match = className.match(/([a-zA-Z]+)([\d.]+)/);
  if (match) {
    return {
      prefix: match[1],
      number: parseFloat(match[2].replace(".", "")),
    };
  } else {
    return { prefix: className, number: 0 };
  }
}

function processData(dataSinhVien, dataLopMon, dataLop, dataTienDo, jsonData) {
  const headers = jsonData[0];

  const data = jsonData.slice(1).map((row) => {
    let rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });
    return rowData;
  });

  data.forEach((item) => {
    const matchingSinhVien = dataSinhVien.find(
      (sinh_vien) => item.Email.toLowerCase() === sinh_vien.email.toLowerCase()
    );

    if (matchingSinhVien && matchingSinhVien !== undefined) {
      dataHandler.push({
        ...item,
        ma_sinh_vien: matchingSinhVien.ma_sinh_vien,
        ho_ten: matchingSinhVien.ho_ten,
      });
    }
  });

  for (let i = dataHandler.length - 1; i >= 0; i--) {
    const maSinhVien = dataHandler[i].ma_sinh_vien;
    const matchingLopMon = dataLopMon.find(
      (lop_mon) => lop_mon.ma_sinh_vien === maSinhVien
    );

    if (!matchingLopMon) {
      dataHandler.splice(i, 1);
    }
  }

  /* TÌM LỚP DỰA THEO MÔN*/
  let lop = null;
  const uniqueTenLop = new Set(dataLop.map((item) => item.ma_mon));
  if (name_file) {
    try {
      const foundClasses = findClassesInText([...uniqueTenLop], name_file);
      lop = foundClasses;
    } catch (error) {
      console.error(error.message);
    }
  }
  dataHandler.forEach((item, index) => {
    const matchingLopMon = dataLopMon.find((lop_mon) => {
      return (
        item.ma_sinh_vien === lop_mon.ma_sinh_vien && lop_mon.ma_mon === lop
      );
    });

    if (matchingLopMon && matchingLopMon !== undefined) {
      dataHandler[index] = {
        ...item,
        ...matchingLopMon,
      };
    }
  });

  function findClassesInText(classes, name_file) {
    if (typeof name_file !== "string") {
      throw new Error("Text must be a string");
    }

    return (
      classes.find((className) => {
        if (typeof className !== "string") {
          console.warn(`Class name is not a string: ${className}`);
          return false;
        }
        return name_file.includes(className);
      }) || "No class found"
    );
  }

  const matchingTienDo = dataTienDo.find((item) => item.ma === lop);

  dataHandler.map((item) => {
    checkProgress(matchingTienDo, item);
  });

  //TRANG THỨ 2
  const uniqueIdLopSet = new Set();

  let ma_mon;
  dataHandler.forEach((item) => {
    ma_mon = item.ma;
    if (item.id_lop !== undefined) {
      uniqueIdLopSet.add(item.id_lop);
    }
  });

  const uniqueIdLopArray = [...uniqueIdLopSet];

  const uniqueIdLopArrayWithField = uniqueIdLopArray.map((item) => {
    return {
      lop: item,
      mon: ma_mon,
    };
  });

  const updatedUniqueIdLopArrayWithField = uniqueIdLopArrayWithField.map(
    (lop) => {
      const matchingLop = dataLop.find(
        (item) => item.ten_lop === lop.lop && item.ma_mon === ma_mon
      );
      /* const matchingLop = matchingGV?.find((item) => item.ma_mon === ma_mon); */
      if (matchingLop) {
        return {
          ...lop,
          giang_vien: matchingLop.giang_vien,
          ngay_bat_dau: matchingLop.ngay_bat_dau,
          ngay_ket_thuc: matchingLop.ngay_ket_thuc,
        };
      } else {
        return lop;
      }
    }
  );

  const updatedStatistics = updatedUniqueIdLopArrayWithField.map((lop) => {
    const studentsInClass = dataHandler.filter(
      (item) => item.id_lop === lop.lop
    );

    const tong_sinh_vien = studentsInClass.length;
    const sinh_vien_chua_hoc = studentsInClass.filter(
      (item) => item.noParticipation === "Chưa tham gia học lần nào"
    ).length;
    noParticipation = "Chưa tham gia học lần nào";
    let sinh_vien_dang_hoc = 0;
    studentsInClass.forEach((item) => {
      if (
        item.quizzesAttempted >= 0 &&
        item.quizzesAttempted < item.totalQuizzes &&
        item.quizzesNotAttempted !== item.totalQuizzes
      ) {
        sinh_vien_dang_hoc += 1;
      }
    });

    const sinh_vien_du_dieu_kien_thi = studentsInClass.filter(
      (item) => item.examEligibility === "Đủ điều kiện dự thi"
    ).length;
    const sinh_vien_cham_tien_do = studentsInClass.filter(
      (item) => item.chamTienDo != ""
    ).length;

    const ti_le_chua_tham_du_hoc =
      tong_sinh_vien > 0 ? (sinh_vien_chua_hoc / tong_sinh_vien) * 100 : 0;
    const ti_le_cham_tien_do =
      tong_sinh_vien > 0 ? (sinh_vien_cham_tien_do / tong_sinh_vien) * 100 : 0;

    return {
      ...lop,
      tong_sinh_vien,
      sinh_vien_chua_hoc,
      sinh_vien_dang_hoc,
      sinh_vien_du_dieu_kien_thi,
      ti_le_chua_tham_du_hoc: ti_le_chua_tham_du_hoc.toFixed(2) + "%",
      sinh_vien_cham_tien_do,
      ti_le_cham_tien_do: ti_le_cham_tien_do.toFixed(2) + "%",
    };
  });

  dataHandler = dataHandler.filter((item) => item.id_lop !== undefined);
  //TRANG ĐẦU
  generateExcelFile(downloadButton, dataHandler, updatedStatistics);
}

function getLargestNumber(str) {
  if (!str) {
    return undefined;
  }
  // Sử dụng RegExp để trích xuất các số từ chuỗi
  const numbers = str.match(/\d+/g);

  // Chuyển đổi các số thành số nguyên
  const numbersInt = numbers.map(Number);

  // Tìm số lớn nhất sử dụng Math.max()
  const largestNumber = Math.max(...numbersInt);

  return largestNumber;
}

function findPositionInTimeRange(
  formattedDate,
  tuNgayLamQuiz,
  deadlineHoanThanhQuiz
) {
  // Chuyển đổi định dạng ngày tháng "dd/mm/yyyy" sang Date object
  const [day, month, year] = formattedDate.split("/");
  const currentDate = new Date(year, month - 1, day);

  // Tìm vị trí bằng cách so sánh ngày tháng hiện tại với các mảng
  for (let i = 0; i < tuNgayLamQuiz.length; i++) {
    const [startDay, startMonth, startYear] = tuNgayLamQuiz[i].split("/");
    const startDate = new Date(startYear, startMonth - 1, startDay);

    const [endDay, endMonth, endYear] = deadlineHoanThanhQuiz[i].split("/");
    const endDate = new Date(endYear, endMonth - 1, endDay);

    if (currentDate >= startDate && currentDate <= endDate) {
      return i;
    }
  }

  // Nếu không nằm trong bất kỳ khoảng nào, trả về null
  return 0;
}

function findPositionInTimeRangeFail(
  formattedDate,
  tuNgayLamQuiz,
  deadlineHoanThanhQuiz
) {
  const [day, month, year] = formattedDate.split("/");
  const currentDate = new Date(year, month - 1, day);

  // Khởi tạo biến để lưu trữ vị trí và khoảng cách nhỏ nhất
  let closestIndex = -1;
  let closestDistance = Number.MAX_SAFE_INTEGER;

  // Tìm khoảng cách nhỏ nhất giữa ngày hiện tại và các ngày trong mảng
  for (let i = 0; i < tuNgayLamQuiz.length; i++) {
    const [startDay, startMonth, startYear] = tuNgayLamQuiz[i].split("/");
    const startDate = new Date(startYear, startMonth - 1, startDay);

    const [endDay, endMonth, endYear] = deadlineHoanThanhQuiz[i].split("/");
    const endDate = new Date(endYear, endMonth - 1, endDay);

    // Tính khoảng cách tuyệt đối giữa ngày hiện tại và khoảng thời gian
    const distanceToStart = Math.abs(currentDate - startDate);
    const distanceToEnd = Math.abs(currentDate - endDate);

    // Kiểm tra nếu khoảng cách đến ngày bắt đầu hoặc kết thúc gần nhất
    if (distanceToStart < closestDistance) {
      closestDistance = distanceToStart;
      closestIndex = i;
    }
    if (distanceToEnd < closestDistance) {
      closestDistance = distanceToEnd;
      closestIndex = i;
    }
  }

  // Trả về vị trí của khoảng thời gian gần nhất
  return closestIndex;
}

function checkWeeklyProgress(progressTemplate, studentProgress, currentWeek) {
  const quizzesPerWeek = {
    1: progressTemplate.tuan1.match(/\d+/g).map(Number),
    2: progressTemplate.tuan2.match(/\d+/g).map(Number),
    3: progressTemplate.tuan3.match(/\d+/g).map(Number),
    4: progressTemplate.tuan4.match(/\d+/g).map(Number),
    5: progressTemplate.tuan5.match(/\d+/g).map(Number),
  };

  if (currentWeek > 5) {
    currentWeek = 5;
  }
  const currentWeekQuizzes = quizzesPerWeek[currentWeek] || [];

  let isBehindSchedule = false;
  let quizDangLam = 0;
  let pendingQuiz = "";

  const keys = Object.keys(studentProgress);
  const quizArray = [];
  keys?.forEach((key) => {
    if (key.startsWith("Quiz")) {
      const quizObject = {
        quizKey: key,
        value: studentProgress[key],
      };
      quizArray.push(quizObject);
    }
  });

  let pivot = null;
  for (let i = 0; i < quizArray.length; i++) {
    if (quizArray[i].value === "Not Attempted") {
      pivot = quizArray[i].quizKey;
      break;
    }
  }
  for (const quizNum of currentWeekQuizzes) {
    const quizKey = `Quiz ${quizNum}`;

    if (!quizArray[quizKey] || quizArray[quizKey] === "Not Attempted") {
      isBehindSchedule = true;
      pendingQuiz = quizKey;
    } else {
      quizDangLam++;
    }
  }

  /* for (let week = currentWeek + 1; week >= 1; week--) {
    for (const quizNum of currentWeekQuizzes) {
      const quizKey = `Quiz ${quizNum}`;
      if (quizArray[quizKey] == "Not Attempted") {
        console.log("Bị trễ tại", quizKey);
      }
    }
  } */

  studentProgress.isBehindSchedule = isBehindSchedule;
  studentProgress.quizDangLam = quizDangLam;
  studentProgress.pendingQuiz = isBehindSchedule ? pendingQuiz : "N/A";
  studentProgress.thong_tin_quiz_cham = pivot;
  return studentProgress;
}

async function generateExcelFile(
  downloadButton,
  combinedData,
  updatedUniqueIdLopArrayWithField
) {
  const firstItemMaMon = combinedData[0].ma_mon;

  const filteredStudents = staticDataLopMon.filter(
    (student) => student.ma_mon === firstItemMaMon
  );

  const filteredStudentObjects = [];
  filteredStudents.forEach((student) => {
    const found = combinedData.some(
      (item) => item.ma_sinh_vien === student.ma_sinh_vien
    );

    if (!found) {
      /* FIND EMAIL */
      const sinhVienInfo = staticSinhVien.find(
        (sv) => sv.ma_sinh_vien === student.ma_sinh_vien
      );

      const email = sinhVienInfo ? sinhVienInfo.email.toLowerCase() : "N/A";
      const name = sinhVienInfo ? sinhVienInfo.ho_ten : "N/A";
      /* FIND LOP */

      let tenLop = "N/A";
      if (sinhVienInfo) {
        const lopInfo = staticDataLopMon.find(
          (lop) =>
            lop.ma_mon === firstItemMaMon &&
            lop.ma_sinh_vien === sinhVienInfo.ma_sinh_vien
        );
        tenLop = lopInfo ? lopInfo.id_lop : "N/A";
      }

      const newStudent = {
        ma_sinh_vien: student.ma_sinh_vien,
        Email: email.toLowerCase() || "N/A",
        ho_ten: name || "N/A",
        id_lop: tenLop || "N/A",
        ma: firstItemMaMon || "N/A",
        totalQuizzes: "N/A",
        quizzesNotAttempted: "N/A",
        chamTienDo: "N/A",
        quizDangLam: "N/A",
        quizzesAttempted: "N/A",
        noParticipation: "Sinh viên chưa enroll vào khóa học",
        examEligibility: "Không đủ điều kiện dự thi",
      };

      combinedData.push(newStudent);
      filteredStudentObjects.push(newStudent);
    }
  });

  const calculateStatistics = (lop, filteredStudents) => {
    filteredStudents.forEach((student) => {
      if (student.id_lop === lop.lop) {
        lop.tong_sinh_vien += 1;
        lop.sinh_vien_chua_hoc += 1;
        let ti_le_chua_tham_du_hoc =
          lop.tong_sinh_vien > 0
            ? (lop.sinh_vien_chua_hoc / lop.tong_sinh_vien) * 100
            : 0;
        lop.ti_le_chua_tham_du_hoc = ti_le_chua_tham_du_hoc.toFixed(2) + "%";
      }
    });
    return lop;
  };

  updatedUniqueIdLopArrayWithField.map((lop) => {
    const statistics = calculateStatistics(lop, filteredStudentObjects);
    return statistics;
  });

  function handleDataExcel() {
    combinedData.sort((a, b) => {
      const classA = splitClassName(a.id_lop);
      const classB = splitClassName(b.id_lop);

      if (classA.prefix < classB.prefix) return -1;
      if (classA.prefix > classB.prefix) return 1;
      return classA.number - classB.number;
    });

    if (combinedData.length > 0) {
      const data = combinedData.map((item, index) => [
        { v: index + 1, s: dataStyle },
        { v: item.ma_sinh_vien, s: dataStyle },
        { v: item.Email.toLowerCase(), s: dataStyle },
        { v: item.ho_ten, s: dataStyle },
        { v: item.id_lop || "", s: dataStyle },
        { v: item.ma, s: dataStyle },
        {
          v: item.totalQuizzes,
          s: { ...dataStyle, alignment: { horizontal: "center" } },
        },
        {
          v: item.quizzesNotAttempted,
          s: { ...dataStyle, alignment: { horizontal: "center" } },
        },
        {
          v: item.quizDangLam,
          s: { ...dataStyle, alignment: { horizontal: "center" } },
        },
        {
          v: item.quizzesAttempted,
          s: {
            ...dataStyle,
            alignment: { horizontal: "center" },
            font: { color: { rgb: "FF0000" } },
          },
        },
        {
          v: item.noParticipation,
          s: { ...dataStyle, alignment: { horizontal: "center" } },
        },
        {
          v: item.examEligibility,
          s: { ...dataStyle, alignment: { horizontal: "center" } },
        },
        {
          v:
            item.chamTienDo.replace(
              /Quiz \d+: Quiz \d+/g,
              (match) => match.split(": ")[1]
            ) || "",
          s: { ...dataStyle, alignment: { horizontal: "center" } },
        },
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

      worksheet["!rows"] = chieu_cao_sheet_1;
      worksheet["!cols"] = chieu_rong_sheet_1;
      const workbook = XLSX.utils.book_new();

      //TRANG 2

      updatedUniqueIdLopArrayWithField.sort((a, b) => {
        const classA = splitClassName(a.lop);
        const classB = splitClassName(b.lop);

        if (classA.prefix < classB.prefix) return -1;
        if (classA.prefix > classB.prefix) return 1;
        return classA.number - classB.number;
      });

      const data2 = updatedUniqueIdLopArrayWithField.map((item, index) => [
        { v: index + 1, s: dataStyle },
        { v: item.lop, s: dataStyle },
        { v: item.mon, s: dataStyle },
        { v: item.giang_vien, s: dataStyle },
        { v: item.ngay_bat_dau || "", s: dataStyle },
        { v: item.ngay_ket_thuc, s: dataStyle },
        { v: item.tong_sinh_vien, s: dataStyle },
        { v: item.sinh_vien_chua_hoc, s: dataStyle },
        { v: item.sinh_vien_dang_hoc, s: dataStyle },
        { v: item.sinh_vien_du_dieu_kien_thi, s: dataStyle },
        {
          v: item.ti_le_chua_tham_du_hoc,
          s: {
            ...dataStyle,
            fill: { fgColor: { rgb: "FFAAAA" } },
          },
        },
        { v: item.sinh_vien_cham_tien_do, s: dataStyle },
        { v: item.ti_le_cham_tien_do, s: dataStyle },
      ]);

      const titleRow2 = [
        {
          v: "THỐNG KÊ TÌNH HÌNH HỌC",
          s: {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
          },
        },
      ];

      const worksheetData2 = [titleRow2, headers2, ...data2];

      const worksheet2 = XLSX.utils.aoa_to_sheet(worksheetData2);

      worksheet2["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers2.length - 1 } },
      ];

      // Đặt chiều cao cho hàng tiêu đề và các hàng khác theo yêu cầu
      worksheet2["!rows"] = chieu_cao_sheet_2;

      worksheet2["!cols"] = chieu_rong_sheet_2;

      //TRANG 3

      const uniqueGiangVienData = {};
      updatedUniqueIdLopArrayWithField.forEach((item) => {
        const giang_vien = item.giang_vien;
        if (!uniqueGiangVienData[giang_vien]) {
          uniqueGiangVienData[giang_vien] = {
            tong_sinh_vien: 0,
            sinh_vien_chua_hoc: 0,
            sinh_vien_dang_hoc: 0,
            sinh_vien_du_dieu_kien_thi: 0,
            ti_le_chua_tham_du_hoc: 0,
            sinh_vien_cham_tien_do: 0,
            ti_le_cham_tien_do: 0,
            ti_le_chua_tham_du_hoc_count: 0,
            ti_le_cham_tien_do_count: 0,
          };
        }
        uniqueGiangVienData[giang_vien].tong_sinh_vien += item.tong_sinh_vien;
        uniqueGiangVienData[giang_vien].sinh_vien_chua_hoc +=
          item.sinh_vien_chua_hoc;
        uniqueGiangVienData[giang_vien].sinh_vien_dang_hoc +=
          item.sinh_vien_dang_hoc;
        uniqueGiangVienData[giang_vien].sinh_vien_du_dieu_kien_thi +=
          item.sinh_vien_du_dieu_kien_thi;
        uniqueGiangVienData[giang_vien].sinh_vien_cham_tien_do +=
          item.sinh_vien_cham_tien_do;

        uniqueGiangVienData[giang_vien].ti_le_chua_tham_du_hoc += parseFloat(
          item.ti_le_chua_tham_du_hoc.replace("%", "")
        );
        uniqueGiangVienData[giang_vien].ti_le_chua_tham_du_hoc_count += 1;

        uniqueGiangVienData[giang_vien].ti_le_cham_tien_do += parseFloat(
          item.ti_le_cham_tien_do.replace("%", "")
        );
        uniqueGiangVienData[giang_vien].ti_le_cham_tien_do_count += 1;
      });

      const data3 = Object.keys(uniqueGiangVienData).map((giang_vien) => {
        const giangVienData = uniqueGiangVienData[giang_vien];
        return [
          { v: giang_vien, s: dataStyle },
          { v: giangVienData.tong_sinh_vien, s: dataStyle },
          { v: giangVienData.sinh_vien_chua_hoc, s: dataStyle },
          { v: giangVienData.sinh_vien_dang_hoc, s: dataStyle },
          { v: giangVienData.sinh_vien_du_dieu_kien_thi, s: dataStyle },
          {
            v:
              (
                giangVienData.ti_le_chua_tham_du_hoc /
                giangVienData.ti_le_chua_tham_du_hoc_count
              ).toFixed(2) + "%",
            s: {
              ...dataStyle,
              fill: { fgColor: { rgb: "FFAAAA" } },
            },
          },
          { v: giangVienData.sinh_vien_cham_tien_do, s: dataStyle },
          {
            v:
              (
                giangVienData.ti_le_cham_tien_do /
                giangVienData.ti_le_cham_tien_do_count
              ).toFixed(2) + "%",
            s: dataStyle,
          },
        ];
      });

      const totalRow = [
        { v: "Total", s: { ...dataStyle, font: { bold: true } } },
        {
          v: data3.reduce((sum, row) => sum + row[1].v, 0),
          s: { ...dataStyle, font: { bold: true } },
        },
        {
          v: data3.reduce((sum, row) => sum + row[2].v, 0),
          s: { ...dataStyle, font: { bold: true } },
        },
        {
          v: data3.reduce((sum, row) => sum + row[3].v, 0),
          s: { ...dataStyle, font: { bold: true } },
        },
        {
          v: data3.reduce((sum, row) => sum + row[4].v, 0),
          s: { ...dataStyle, font: { bold: true } },
        },
        {
          v:
            data3
              .reduce(
                (sum, row) => sum + parseFloat(row[5].v.replace("%", "")),
                0
              )
              .toFixed(2) + "%",
          s: { ...dataStyle, font: { bold: true } },
        },
        {
          v: data3.reduce((sum, row) => sum + row[6].v, 0),
          s: { ...dataStyle, font: { bold: true } },
        },
        {
          v:
            data3
              .reduce(
                (sum, row) => sum + parseFloat(row[7].v.replace("%", "")),
                0
              )
              .toFixed(2) + "%",
          s: { ...dataStyle, font: { bold: true } },
        },
      ];

      data3.push(totalRow);

      const titleRow = [
        {
          v: "THỐNG KÊ GIẢNG VIÊN",
          s: {
            font: { bold: true },
            alignment: { horizontal: "center", vertical: "center" },
          },
        },
      ];

      const worksheetData = [titleRow, ...[headers3], ...data3];

      const worksheet3 = XLSX.utils.aoa_to_sheet(worksheetData);

      worksheet3["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers3.length - 1 } },
      ];

      // Đặt chiều cao cho hàng tiêu đề
      worksheet3["!rows"] = chieu_cao_sheet_3;
      worksheet3["!cols"] = chieu_rong_sheet_3;

      XLSX.utils.book_append_sheet(workbook, worksheet, "DSSV COM");
      XLSX.utils.book_append_sheet(workbook, worksheet2, "Tke lop mon");
      XLSX.utils.book_append_sheet(workbook, worksheet3, "Tke Gv");

      const id_lop = combinedData.find((item) => item.ma)?.ma;
      if (!id_lop) {
        throw new Error("Không tìm thấy id_lop trong combinedData");
      }
      const fileName = `Tiến độ sinh viên ${id_lop}.xlsx`;
      setTimeout(() => {
        XLSX.writeFile(workbook, fileName, {
          bookType: "xlsx",
          type: "array",
        });
        console.log("Excel file downloaded successfully!");
        combinedData = [];
        uniqueIdLopArray = [];
        updatedUniqueIdLopArrayWithField = [];
        fileName = "";
      }, 3200);

      dataHandler = [];
      /* ------------------------------------------- */
      setTimeout(() => {
        let btn = $(".dl-button"),
          label = btn.find(".label"),
          counter = label.find(".counter");

        setLabel(
          label,
          label.find(".state"),
          label.find(".default"),
          function () {
            counter.removeClass("hide");
            btn.removeClass("done");
          }
        );
      }, 5000);

      /* -------------------------------------------- */
      return false;
    } else {
      console.log(
        "No data available to download. Please ensure files are uploaded and processed correctly."
      );
    }
  }
  handleDataExcel();
  downloadButton.style.display = "block";
}
