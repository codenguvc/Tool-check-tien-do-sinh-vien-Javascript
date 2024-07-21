const id = "#large_dropzone";
const dropzone = document.querySelector(id);

var previewNode = dropzone.querySelector(".dropzone-item");
previewNode.id = "";
var previewTemplate = previewNode.parentNode.innerHTML;
previewNode.parentNode.removeChild(previewNode);

let alertDisplayed = false;

const myDropzone = new Dropzone(id, {
  url: "/",
  method: "get",
  parallelUploads: 20,
  maxFilesize: 10000,
  maxFiles: 4,
  acceptedFiles: ".xlsx, .csv",
  previewTemplate: previewTemplate,
  previewsContainer: id + " .dropzone-items",
  clickable: id + " .dropzone-select",
});

const header_danh_sach_lop = [
  "id lớp",
  "Tên lớp",
  "Block",
  "Mã Chuyển đổi",
  "Mã môn",
  "Tên môn",
  "Ca học",
  "Ngày bắt đầu",
  "Ngày kết thúc",
  "số lượng sinh viên",
  "Giảng viên",
  "ID phòng",
  "Tên phòng",
  "mô tả phòng",
];
const header_danh_sach_lop_mon = [
  "STT",
  "Mã sinh viên",
  "Họ và tên",
  "Kì thứ",
  "Trạng thái",
  "Tên đăng nhập",
  "Mã Ngành",
  "ID lớp",
  "Tên lớp",
  "Ca học",
  "Mã môn",
  "kỳ theo khung",
  "Ngày bắt đầu",
  "Số lần học",
  "Trạng Thái",
];
const header_tien_do = [
  "TT",
  "Môn",
  "Mã môn",
  "BM",
  "Tuần 1 (Block 1)",
  "Tuần 2",
  "Tuần 3",
  "Tuần 4",
  "Tuần 5",
  "Tuần 6",
  "Tuần 7",
  "Tuần 8 (Block 2)",
  "Tuần 9",
  "Tuần 10",
  "Tuần 11",
  "Tuần 12",
  "Tuần 13",
  "Tuần 14",
  "Loại môn",
  "ASM",
];
const header_danh_sach_sinh_vien = [
  "#",
  "ID",
  "mã sinh viên",
  "mã sinh viên cũ",
  "Pháp nhân",
  "Trạng thái học",
  "Họ và tên",
  "Giới tính",
  "Ngày sinh",
  "Số CMND",
  "Ngày cấp",
  "Nơi cấp",
  "Tên đăng nhâp",
  "Email",
  "Dân tộc",
  "Địa chỉ",
  "SĐT",
  "Kỳ học",
  "Khóa nhập học",
  "Khóa thực học",
  "Ngành",
  "Ngành in bằng",
  "Mã Ngành",
  "Chuyên Ngành",
];

function checkMatch(jsonData, list) {
  return (
    JSON.stringify(jsonData[0]) === JSON.stringify(list[0]) &&
    JSON.stringify(jsonData[2]) === JSON.stringify(list[2])
  );
}

function updateCheckbox(id, checked) {
  const checkbox = document.getElementById(id);
  if (checkbox) {
    checkbox.checked = checked;
  }
}

function resetCheckboxes() {
  updateCheckbox("1", false);
  updateCheckbox("2", false);
  updateCheckbox("3", false);
  updateCheckbox("4", false);
}

function excelDateToString(serial) {
  const utc_days = Math.floor(serial - 25569);
  const date_info = new Date(utc_days * 86400 * 1000);

  const fractional_day = serial - Math.floor(serial);
  let total_seconds = Math.floor(86400 * fractional_day);

  const seconds = total_seconds % 60;
  total_seconds -= seconds;

  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;

  date_info.setHours(hours);
  date_info.setMinutes(minutes);
  date_info.setSeconds(seconds);

  const day = String(date_info.getDate()).padStart(2, "0");
  const month = String(date_info.getMonth() + 1).padStart(2, "0");
  const year = date_info.getFullYear();

  return `${day}/${month}/${year}`;
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

function calculateQuizDifference(str) {
  if (!str) {
    return undefined;
  }

  // Sử dụng RegExp để trích xuất các số từ chuỗi
  const numbers = str.match(/\d+/g);

  // Nếu không tìm thấy số nào trong chuỗi, trả về undefined
  if (!numbers) {
    return undefined;
  }

  // Chuyển đổi các số thành số nguyên
  const numbersInt = numbers.map(Number);

  // Nếu chỉ có 1 số bất kì, trả về 1
  if (numbersInt.length === 1) {
    return 1;
  }

  // Nếu có 2 số, lấy số lớn trừ số nhỏ và trả về kết quả
  if (numbersInt.length === 2) {
    const diff = Math.abs(numbersInt[1] - numbersInt[0]);
    return diff;
  }

  // Nếu có nhiều hơn 2 số, tìm số lớn nhất và số nhỏ nhất, sau đó tính hiệu
  const maxNumber = Math.max(...numbersInt);
  const minNumber = Math.min(...numbersInt);
  const difference = maxNumber - minNumber;

  return difference;
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
    const startDate = new Date(tuNgayLamQuiz[i]);
    const endDate = new Date(deadlineHoanThanhQuiz[i]);

    if (currentDate >= startDate && currentDate <= endDate) {
      return i; // Trả về vị trí nếu nằm trong khoảng
    }
  }

  // Nếu không nằm trong bất kỳ khoảng nào, trả về null
  return null;
}

/* function readFromIndexedDB() {
  const transaction = db.transaction(["data"], "readonly");
  const store = transaction.objectStore("data");
  const request = store.getAll();

  request.onerror = function (event) {
    console.error("Error reading data from IndexedDB");
  };

  request.onsuccess = function (event) {
    console.log("Data read from IndexedDB:", request.result);
    // Xử lý dữ liệu ở đây
  };
} */

let file_lop, file_lop_mon, file_tien_do, file_sinh_vien;
let extractedValuesLop,
  extractedValuesLopMon,
  extractedValuesSinhVien,
  extractedValuesTienDo;
let tuNgayLamQuiz, deadlineHoanThanhQuiz;
async function checkFiles(files) {
  resetCheckboxes();

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

  const checks = files.map(async (file) => {
    const jsonData = await readFile(file);
    if (
      checkMatch(jsonData[0], header_danh_sach_lop) ||
      checkMatch(jsonData[2], header_danh_sach_lop)
    ) {
      updateCheckbox("1", true);
      file_lop = jsonData.filter((row) => {
        // Check if any cell in the row has a value
        return row.some((cell) => cell !== "");
      });
      extractedValuesLop = file_lop.map((row) => ({
        ten_lop: row[1],
        ma_mon: row[4],
        ngay_bat_dau: excelDateToString(row[7]),
        ngay_ket_thuc: excelDateToString(row[8]),
        so_luong_giang_vien: row[9],
        giang_vien: row[10],
      }));
      /* console.log(
        "------------------------TÊN LỚP, MÃ MÔN, NGÀY BẮT ĐẦU, NGÀY KẾT THÚC, SỐ LƯỢNG GIẢNG VIÊN, GIẢNG VIÊN CỦA FILE LỚP-------------------------------"
      );
      extractedValuesLop.slice(1).map((item) => {
        console.log(item);
      }); */
    } else if (
      checkMatch(jsonData[0], header_danh_sach_lop_mon) ||
      checkMatch(jsonData[2], header_danh_sach_lop_mon)
    ) {
      updateCheckbox("2", true);
      file_lop_mon = jsonData.filter((row) => {
        // Check if any cell in the row has a value
        return row.some((cell) => cell !== "");
      });
      extractedValuesLopMon = file_lop_mon.map((row) => ({
        ma_sinh_vien: row[1],
        ho_va_ten: row[2],
        id_lop: row[7],
        ma_mon: row[10],
      }));
      /* console.log(
        "------------------------TÊN LỚP, HỌ VÀ TÊN, ID LỚP, MÃ MÔN CỦA FILE LỚP MÔN-------------------------------"
      );
      extractedValuesLopMon.slice(1).map((item) => {
        console.log(item);
      }); */
    } else if (
      checkMatch(jsonData[0], header_tien_do) ||
      checkMatch(jsonData[2], header_tien_do)
    ) {
      updateCheckbox("3", true);
      file_tien_do = jsonData.filter((row) => {
        return row.some((cell) => cell !== "");
      });

      tuNgayLamQuiz = file_tien_do[3];
      deadlineHoanThanhQuiz = file_tien_do[4];

      tuNgayLamQuiz = tuNgayLamQuiz
        .slice(2)
        .filter((ngayLamQuiz) => ngayLamQuiz);
      deadlineHoanThanhQuiz = deadlineHoanThanhQuiz
        .slice(2)
        .filter((deadline) => deadline);

      let tuNgayLamQuizNew = [];
      let deadlineHoanThanhQuizNew = [];
      tuNgayLamQuiz.forEach((item) => {
        tuNgayLamQuizNew.push(excelDateToString(item));
      });

      deadlineHoanThanhQuiz.forEach((item) => {
        deadlineHoanThanhQuizNew.push(excelDateToString(item));
      });

      tuNgayLamQuiz = tuNgayLamQuizNew;
      deadlineHoanThanhQuiz = deadlineHoanThanhQuizNew;

      localStorage.setItem("tuNgayLamQuiz", JSON.stringify(tuNgayLamQuiz));
      localStorage.setItem(
        "deadlineHoanThanhQuiz",
        JSON.stringify(deadlineHoanThanhQuiz)
      );

      /* const savedTuNgayLamQuiz = localStorage.getItem("tuNgayLamQuiz");
      const savedDeadlineHoanThanhQuiz = localStorage.getItem(
        "deadlineHoanThanhQuiz"
      ); */

      file_tien_do = file_tien_do.slice(5);
      extractedValuesTienDo = file_tien_do.map((row) => ({
        ma: row[2],
        tuan1: row[4],
        tuan2: row[5],
        tuan3: row[6],
        tuan4: row[7],
        tuan5: row[8],
      }));
      /* console.log(
        "------------------------MÃ, ACCOUNT, HỌ VÀ TÊN, TÊN LỚP, MÃ MÔN CỦA FILE TIẾN ĐỘ-------------------------------"
      );
      extractedValuesTienDo.slice(1).map((item) => {
        console.log(item);
      }); */
    } else if (
      checkMatch(jsonData[0], header_danh_sach_sinh_vien) ||
      checkMatch(jsonData[2], header_danh_sach_sinh_vien)
    ) {
      updateCheckbox("4", true);
      file_sinh_vien = jsonData.filter((row) => {
        // Check if any cell in the row has a value
        return row.some((cell) => cell !== "");
      });

      extractedValuesSinhVien = file_sinh_vien.map((row) => ({
        ma_sinh_vien: row[2],
        email: row[13],
        ho_ten: row[6],
      }));

      /* console.log(
        "------------------------EMAIL CỦA FILE SINH VIÊN-------------------------------"
      );
      extractedValuesSinhVien.slice(1).map((item) => {
        console.log(item);
      }); */
    }
  });

  await Promise.all(checks);
  const combinedData = [];
  if (extractedValuesSinhVien && extractedValuesLopMon) {
    // Check if extractedValuesSinhVien is not empty before iterating
    if (extractedValuesSinhVien.length > 0) {
      extractedValuesLopMon.forEach((lopMon) => {
        console.log(lopMon);
        // Tìm kiếm thông tin môn học tương ứng cho sinh viên này
        const matchingLopMon = extractedValuesSinhVien.find((sinh_vien) => {
          return lopMon.ma_sinh_vien === sinh_vien.ma_sinh_vien;
        });

        if (matchingLopMon) {
          combinedData.push({
            email: matchingLopMon.email,
            ma_sinh_vien: matchingLopMon.ma_sinh_vien,
            ho_va_ten: matchingLopMon.ho_ten,
            id_lop: lopMon.id_lop,
            ma_mon: lopMon.ma_mon,
          });
        }
      });
    }
    if (combinedData.length > 0) {
      combinedData.forEach((com) => {
        const matchingLop = extractedValuesLop.find((lop) => {
          return lop.ma_mon === com.ma_mon;
        });
        if (matchingLop) {
          com.ten_lop = matchingLop.ten_lop;
          com.ngay_bat_dau = matchingLop.ngay_bat_dau;
          com.ngay_ket_thuc = matchingLop.ngay_ket_thuc;
          com.so_luong_giang_vien = matchingLop.so_luong_giang_vien;
          com.giang_vien = matchingLop.giang_vien;
        }
      });
    }
    /* console.log("Tổng hợp dữ liệu thô từ 3 file sinh viên, lớp môn & lớp");
    console.log(combinedData); */

    combinedData.forEach((com, index) => {
      const matchingTienDo = extractedValuesTienDo.find((tien_do) => {
        return tien_do.ma === com.ma_mon;
      });
      if (matchingTienDo) {
        com.tuan1 = matchingTienDo.tuan1;
        com.tuan2 = matchingTienDo.tuan2;
        com.tuan3 = matchingTienDo.tuan3;
        com.tuan4 = matchingTienDo.tuan4;
        com.tuan5 = matchingTienDo.tuan5;

        if (com.tuan2) {
          const quizzes = com.tuan2.split(", ");
          const completedQuizzes = quizzes.reduce((count, quiz) => {
            const range = quiz.match(/Quiz (\d+)-(\d+)/);
            if (range) {
              const start = parseInt(range[1], 10);
              const end = parseInt(range[2], 10);
              return count + (end - start + 1);
            }
            return count;
          }, 0);
          com.tien_do = completedQuizzes >= 4 ? "" : "Chậm tiến độ";
        } else {
          com.tien_do = "";
        }
      }
    });

    combinedData.map((item) => {
      const largestNumber = getLargestNumber(item.tuan5);
      item.sum_quiz = largestNumber;
    });

    const today = new Date();
    const formattedDate = `${today.getDate()}/${
      today.getMonth() + 1
    }/${today.getFullYear()}`;
    let position = findPositionInTimeRange(
      formattedDate,
      tuNgayLamQuiz,
      deadlineHoanThanhQuiz
    );
    position = position - 1;

    combinedData.map((item) => {
      if (position === 0) {
        if (item.sum_quiz == undefined) {
          item.sum_quiz = "N/A";
          item.quiz_da_dat = "N/A";
          item.quiz_chua_hoc = "N/A";
          item.quiz_dang_hoc = "N/A";
          item.state = "Sinh viên chưa enroll vào khóa học";
          item.dieu_kien = "Không đủ điều kiện dự thi";
          item.tien_do = "N/A";
        } else {
          const largestNumber = getLargestNumber(item.tuan1);
          item.quiz_da_dat = largestNumber;
          item.quiz_chua_hoc = item.sum_quiz - item.quiz_da_dat;
          item.quiz_dang_hoc = calculateQuizDifference(item.tuan1);
          if (item.quiz_da_dat == item.sum_quiz) {
            item.dieu_kien = "Đủ điều kiện dự thi";
          } else {
            item.dieu_kien = "Không đủ điều kiện dự thi";
          }
          if (item.quiz_da_dat == 0) {
            item.state = "Chưa tham gia học lần nào";
          } else {
            item.state = "";
          }
        }
      }

      if (position === 1) {
        if (item.sum_quiz == undefined) {
          item.sum_quiz = "N/A";
          item.quiz_da_dat = "N/A";
          item.quiz_chua_hoc = "N/A";
          item.quiz_dang_hoc = "N/A";
          item.state = "Sinh viên chưa enroll vào khóa học";
          item.dieu_kien = "Không đủ điều kiện dự thi";
          item.tien_do = "N/A";
        } else {
          const largestNumber = getLargestNumber(item.tuan2);
          item.quiz_da_dat = largestNumber;
          item.quiz_chua_hoc = item.sum_quiz - item.quiz_da_dat;
          item.quiz_dang_hoc = calculateQuizDifference(item.tuan2);
          if (item.quiz_da_dat == item.sum_quiz) {
            item.dieu_kien = "Đủ điều kiện dự thi";
          } else {
            item.dieu_kien = "Không đủ điều kiện dự thi";
          }
          if (item.quiz_da_dat == 0) {
            item.state = "Chưa tham gia học lần nào";
          } else {
            item.state = "";
          }
        }
      }

      if (position === 2) {
        if (item.sum_quiz == undefined) {
          item.sum_quiz = "N/A";
          item.quiz_da_dat = "N/A";
          item.quiz_chua_hoc = "N/A";
          item.quiz_dang_hoc = "N/A";
          item.state = "Sinh viên chưa enroll vào khóa học";
          item.dieu_kien = "Không đủ điều kiện dự thi";
          item.tien_do = "N/A";
        } else {
          const largestNumber = getLargestNumber(item.tuan4);
          item.quiz_da_dat = largestNumber;
          item.quiz_chua_hoc = item.sum_quiz - item.quiz_da_dat;
          item.quiz_dang_hoc = calculateQuizDifference(item.tuan3);
          if (item.quiz_da_dat == item.sum_quiz) {
            item.dieu_kien = "Đủ điều kiện dự thi";
          } else {
            item.dieu_kien = "Không đủ điều kiện dự thi";
          }
          if (item.quiz_da_dat == 0) {
            item.state = "Chưa tham gia học lần nào";
          } else {
            item.state = "";
          }
        }
      }

      if (position === 3) {
        if (item.sum_quiz == undefined) {
          item.sum_quiz = "N/A";
          item.quiz_da_dat = "N/A";
          item.quiz_chua_hoc = "N/A";
          item.quiz_dang_hoc = "N/A";
          item.state = "Sinh viên chưa enroll vào khóa học";
          item.dieu_kien = "Không đủ điều kiện dự thi";
          item.tien_do = "N/A";
        } else {
          const largestNumber = getLargestNumber(item.tuan4);
          item.quiz_da_dat = largestNumber;
          item.quiz_chua_hoc = item.sum_quiz - item.quiz_da_dat;
          item.quiz_dang_hoc = calculateQuizDifference(item.tuan4);
          if (item.quiz_da_dat == item.sum_quiz) {
            item.dieu_kien = "Đủ điều kiện dự thi";
          } else {
            item.dieu_kien = "Không đủ điều kiện dự thi";
          }
          if (item.quiz_da_dat == 0) {
            item.state = "Chưa tham gia học lần nào";
          } else {
            item.state = "";
          }
        }
      }

      if (position === 4) {
        if (item.sum_quiz == undefined) {
          item.sum_quiz = "N/A";
          item.quiz_da_dat = "N/A";
          item.quiz_chua_hoc = "N/A";
          item.quiz_dang_hoc = "N/A";
          item.state = "Sinh viên chưa enroll vào khóa học";
          item.dieu_kien = "Không đủ điều kiện dự thi";
          item.tien_do = "N/A";
        } else {
          const largestNumber = getLargestNumber(item.tuan5);
          item.quiz_da_dat = largestNumber;
          item.quiz_chua_hoc = item.sum_quiz - item.quiz_da_dat;
          item.quiz_dang_hoc = calculateQuizDifference(item.tuan5);
          if (item.quiz_da_dat == item.sum_quiz) {
            item.dieu_kien = "Đủ điều kiện dự thi";
          } else {
            item.dieu_kien = "Không đủ điều kiện dự thi";
          }
          if (item.quiz_da_dat == 0) {
            item.state = "Chưa tham gia học lần nào";
          } else {
            item.state = "";
          }
        }
      }
    });

    /* const subjects = [...new Set(combinedData.map((item) => item.ma_mon))];
    console.log(subjects); */
    /* --------------------------------------------------START INDEXDB-------------------------------------------------- */
    if (
      extractedValuesSinhVien.length > 0 &&
      extractedValuesLop.length > 0 &&
      extractedValuesTienDo.length > 0 &&
      extractedValuesLopMon.length > 0
    ) {
      window.indexedDB.deleteDatabase("fpt-tool");
      var request = window.indexedDB.open("fpt-tool", 1);
      // Xử lý sự kiện khi cơ sở dữ liệu cần nâng cấp
      request.onupgradeneeded = function (event) {
        console.log("Đã vào đây");
        const db = event.target.result;

        const objectStoreLopMon = db.createObjectStore("lopMonStore", {
          autoIncrement: true,
        });
        const objectStoreLop = db.createObjectStore("lopStore", {
          autoIncrement: true,
        });
        const objectStoreTienDo = db.createObjectStore("tienDoStore", {
          autoIncrement: true,
        });
        const objectStoreSinhVien = db.createObjectStore("sinhVienStore", {
          autoIncrement: true,
        });

        extractedValuesSinhVien.map((sinhvien) => {
          objectStoreSinhVien.add(sinhvien);
        });

        extractedValuesLop.map((lop) => {
          objectStoreLop.add(lop);
        });
        extractedValuesLopMon.map((lopmon) => {
          objectStoreLopMon.add(lopmon);
        });
        extractedValuesTienDo.map((tiendo) => {
          objectStoreTienDo.add(tiendo);
        });
      };
    }
    /* ---------------------------------------------------END INDEXDB-------------------------------------------------- */

    /* downloadButton.style.display = "flex"; */
  }
}

myDropzone.on("addedfile", function (file) {
  const dropzoneItems = dropzone.querySelectorAll(".dropzone-item");
  dropzoneItems.forEach((dropzoneItem) => {
    dropzoneItem.style.display = "";
  });

  checkFiles(myDropzone.files);
});

// Update the total progress bar
myDropzone.on("totaluploadprogress", function (progress) {
  const progressBars = dropzone.querySelectorAll(".progress-bar");
  progressBars.forEach((progressBar) => {
    progressBar.style.width = progress + "%";
  });
});

myDropzone.on("sending", function (file) {
  const progressBars = dropzone.querySelectorAll(".progress-bar");
  progressBars.forEach((progressBar) => {
    progressBar.style.opacity = "1";
  });
});

myDropzone.on("complete", function (progress) {
  const progressBars = dropzone.querySelectorAll(".dz-complete");

  setTimeout(function () {
    progressBars.forEach((progressBar) => {
      progressBar.querySelector(".progress-bar").style.opacity = "0";
      progressBar.querySelector(".progress").style.opacity = "0";
    });
  }, 300);
});

myDropzone.on("maxfilesexceeded", function (file) {
  myDropzone.removeFile(file);
  if (!alertDisplayed) {
    createToast(
      "error",
      "bi bi-exclamation-circle",
      "Error",
      "You can only upload a maximum of 4 Excel files."
    );
    alertDisplayed = true;
  }
});

myDropzone.on("removedfile", function () {
  if (myDropzone.files.length < myDropzone.options.maxFiles) {
    alertDisplayed = false;
  }
  setTimeout(() => {
    checkFiles(myDropzone.files);
  }, 0);
});

document
  .querySelector(".dropzone-remove-all")
  .addEventListener("click", function () {
    myDropzone.removeAllFiles(true);
    alertDisplayed = false;
    setTimeout(() => {
      resetCheckboxes();
    }, 0);
  });

document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open("fpt-tool", 1);

  request.onupgradeneeded = function (event) {
    const db = event.target.result;

    if (!db.objectStoreNames.contains("lopMonStore")) {
      db.createObjectStore("lopMonStore", { autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("lopStore")) {
      db.createObjectStore("lopStore", { autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("tienDoStore")) {
      db.createObjectStore("tienDoStore", { autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("sinhVienStore")) {
      db.createObjectStore("sinhVienStore", { autoIncrement: true });
    }
  };

  request.onsuccess = function (event) {
    const db = event.target.result;

    const checkObjectStoreData = (storeName) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const objectStore = transaction.objectStore(storeName);
        const countRequest = objectStore.count();

        countRequest.onsuccess = function () {
          resolve(countRequest.result > 0);
        };

        countRequest.onerror = function () {
          reject(countRequest.error);
        };
      });
    };
    const stores = ["lopMonStore", "lopStore", "tienDoStore", "sinhVienStore"];

    Promise.all(stores.map(checkObjectStoreData))
      .then((results) => {
        const allStoresHaveData = results.every((hasData) => hasData);

        if (allStoresHaveData) {
          document.querySelector("#large_dropzone").innerHTML = `
                <div class="alert alert-info d-flex flex-column align-items-center" role="alert">
                  <div class="icon-file">
                    <i class="bi bi-file-earmark-check"></i>
                  </div>
                  <div>
                    Đã có file dữ liệu mẫu, không cần up tiếp.
                  </div>
                  </br>
                  <a id="deleteAllData" class="btn btn-danger ml-auto">Xóa tất cả dữ liệu mẫu</a>
                </div>
              `;
          document
            .querySelector("#deleteAllData")
            .addEventListener("click", (e) => {
              e.preventDefault();
              handleDeleteFileAll();
            });

          document.getElementById("dropzone").style.pointerEvents = "none";
        }
      })
      .catch((error) => {
        console.error(`Error checking data:`, error);
      });
    stores.forEach((storeName) => {
      checkObjectStoreData(storeName)
        .then((hasData) => {
          if (hasData) {
            updateCheckbox("1", true);
            updateCheckbox("2", true);
            updateCheckbox("3", true);
            updateCheckbox("4", true);
          }
        })
        .catch((error) => {
          console.error(`Error checking data for ${storeName}:`, error);
        });
    });
  };

  request.onerror = function (event) {
    console.error("Error opening IndexedDB:", event.target.errorCode);
  };
});

function handleDeleteFileAll() {
  window.indexedDB.deleteDatabase("fpt-tool");
  updateCheckbox("1", false);
  updateCheckbox("2", false);
  updateCheckbox("3", false);
  updateCheckbox("4", false);

  location.reload();
}
