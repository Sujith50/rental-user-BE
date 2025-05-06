import { db } from "../db.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt, { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const admindetails = db.collection("adminDetails");
const roomDetails = db.collection("roomDetails");
const buildingdetail = db.collection("buildingDetail");
const rentaildetails = db.collection("rentaildetails");
const rentalpayments = db.collection("rentalpayments");
const tenantDetails = db.collection("tenantDetails");

const paymentDetails = db.collection("paymentDetails");
const problems = db.collection("tenantIssues");
const paymentTransaction = db.collection("paymentTransaction");
const jwtSecret = "Test@123";
const saltRound = 9;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mksujith160@gmail.com",
    pass: "jxqrknobozjvcihm",
  },
});
function SendWelcomeEmail(email, otp) {
  const mailOptions = {
    from: "mksujith160@gmail.com",
    to: email,
    subject: "Welcome to Greate",
    text: `Your one time password is ${otp}. Expries in 15 minutes`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`Error sending email ${email}:`, error?.message);
    } else {
      console.log(`Email sent to ${email}:`, info.response);
    }
  });
}
function generateRandomString(length = 14) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
export const resolvers = {
  Query: {
    hello: () => "world",
    users: async (_, {}, { user }) => {
      try {
        if (!user) {
          throw new Error("No Auth");
        }
        const userdata = await tenantDetails.findOne({
          uuid: user,
        });

        if (!userdata) {
          throw new Error("user not found");
        }
        return userdata;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    tenants: async (_, args, {}) => {
      try {
        const result = await rentaildetails.find().toArray();
        return result;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    payments: async (_, args, {}) => {
      try {
        const result = await paymentDetails.find().toArray();
        console.log(result);
        return result;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    tenentpayment: async (_, args, {}) => {
      const { uuid } = args;
      try {
        const result = await paymentDetails.findOne({ tenantuuid: uuid });
        console.log(result);
        return result;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    notify: async (_, args, { user }) => {
      try {
        const userup = true;
        if (userup) {
          const result = await userdetails
            .find({ isverified: false })
            .toArray();
          return result;
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    // admin 2.0:

    // version 2.0
    totalrooms: async (_, {}, { user }) => {
      const uuid = "db547dcb-5f60-4b3b-b2c0-377237c39266";
      try {
        const data = await roomDetails.findOne({ adminuuid: uuid });
        return data?.roomDetail;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    gettenantdetail: async (_, { user }) => {
      try {
        const result = await tenantDetails.find().toArray();
        console.log(result);

        return result;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    tenantpersonal: async (_, args, { user }) => {
      const uuid = user;
      try {
        const exist = await tenantDetails.findOne({ uuid: uuid });
        if (!exist) {
          throw new Error("user does not exist");
        }
        console.log(exist);

        return exist;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    chnagepasswordq: async (_, args) => {
      const { password } = args;
      try {
        const exist = await tenantDetails.findOne({ password: password });
        if (!exist) {
          throw new Error("User did not found");
        }
        return exist;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    getIssues: async (_, args, { user }) => {
      const uuid = user;
      try {
        const exist = await problems.findOne({ tenantuuid: uuid });
        if (!exist) {
          throw new Error("User did not found");
        }
        return exist?.issues;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
  Mutation: {
    onSignupCode: async (_, { input }) => {
      const { email } = input;
      const uuid = uuidv4();
      try {
        const exist = await admindetails.findOne({
          useremail: email,
        });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otphashed = await bcrypt.hash(otp, saltRound);
        if (exist?.uuid && exist?.createstatus === "done") {
          throw new Error("User already exists");
        } else if (exist?.uuid && exist?.createstatus === "onprocess") {
          const datasas = await admindetails.findOneAndUpdate(
            {
              useremail: email,
            },
            {
              $set: {
                otphash: otphashed,
                createstatus: "onprocess",
              },
            }
          );
          return "resend done";
        }

        const document = {
          useremail: email,
          otphash: otphashed,
          uuid: uuid,
          createstatus: "onprocess",
        };
        const result = await admindetails.insertOne(document);
        if (result?.insertedId) {
          console.log(email, otp);
        }
        return "done";
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onForgotCode: async (_, { input }) => {
      const { email } = input;
      try {
        const exist = await admindetails.findOne({
          useremail: email,
        });
        if (exist?.uuid && exist?.createstatus === "done") {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otphashed = await bcrypt.hash(otp, saltRound);
          const result = await admindetails.findOneAndUpdate(
            {
              useremail: email,
            },
            {
              $set: {
                otphash: otphashed,
                createstatus: "onprocess",
              },
            },
            { new: true }
          );

          if (result) {
            console.log(email, otp);
          }
          return "done";
        } else {
          throw new Error("user does not exist");
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onForgotPass: async (_, { input }) => {
      const { email, password, otp } = input;
      try {
        const exist = await admindetails.findOne({
          useremail: email,
        });
        if (exist) {
          const hashedpass = await bcrypt.hash(password, saltRound);
          const result = await admindetails.findOneAndUpdate(
            {
              useremail: email,
            },
            {
              $set: {
                password: hashedpass,
                createstatus: "done",
              },
            },
            { new: true }
          );
          if (result) {
            return "done";
          }
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onVarify: async (_, { input }) => {
      const { email, otp } = input;
      try {
        const exist = await admindetails.findOne({
          useremail: email,
        });
        if (!exist) {
          throw new Error("Invalid email or OTP");
        }
        if (!exist.otphash) {
          throw new Error("OTP verification failed");
        }
        const verifyOtp = await bcrypt.compare(otp, exist.otphash);
        if (!verifyOtp) {
          throw new Error("Invalid email or OTP");
        }

        return true;
      } catch (error) {
        console.error("OTP Verification Error:", error.message);
        throw new Error("OTP verification failed");
      }
    },
    onCreateacc: async (_, { input }) => {
      const { password, email, otp } = input;
      try {
        const exist = await admindetails.findOne({
          useremail: email,
        });
        if (!exist) {
          throw new Error("Invalid email or OTP");
        }
        if (!exist.otphash) {
          throw new Error("OTP verification failed");
        }
        const verifyOtp = await bcrypt.compare(otp, exist.otphash);
        if (!verifyOtp) {
          throw new Error("Invalid email or OTP");
        }
        const hashedpass = await bcrypt.hash(password, saltRound);
        const result = await admindetails.findOneAndUpdate(
          {
            useremail: email,
          },
          {
            $set: {
              password: hashedpass,
              createstatus: "done",
              role: "admin",
              isverified: false,
            },
          },
          { new: true }
        );
        const token = jwt.sign(
          { email: exist.useremail, uuid: exist?.uuid },
          jwtSecret,
          { expiresIn: "7d" } // Token valid for 7 days
        );
        if (result) {
          return token;
        }
      } catch (error) {
        throw new Error(error?.message);
      }
    },
    onLogin: async (_, { input }) => {
      const { email, password } = input;
      console.log(email, "das");
      try {
        const exist = await tenantDetails?.findOne({
          $or: [{ email: email }, { phonenumber: email }],
        });

        if (!exist) {
          throw new Error("User does not exist");
        }
        if (exist?.password) {
          const compare = await bcrypt.compare(password, exist?.password);
          if (!compare) {
            throw new Error("invalid email or Password");
          }
          const token = jwt.sign(
            { email: exist.useremail, uuid: exist?.uuid },
            jwtSecret,
            { expiresIn: "7d" } // Token valid for 7 days
          );
          return token;
        } else {
          throw new Error("User does not exist");
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    buildingDetails: async (_, { input }) => {
      const uuid = uuidv4();
      const {
        type,
        houseno,
        phonenumber,
        name,
        advancepayment,
        livingstart,
        rentpermonth,
        tenantuuid,
      } = input;
      try {
        const exist = await rentaildetails.findOne({ housenumber: houseno });
        if (exist?.tenantname || exist?.tenantphonenumber) {
          throw new Error("already fulled");
        }
        const document = {
          housetype: type,
          houseuuid: uuid,
          housenumber: houseno,
          tenantname: name,
          tenantphonenumber: phonenumber,
          advancepayment: advancepayment,
          startingdate: livingstart,
          rentpermonth: rentpermonth,
          tenantuuid: tenantuuid,
        };

        const result = await rentaildetails.insertOne(document);
        if (result?.insertedId) {
          return "done";
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onPayrent: async (_, { input }) => {
      const { payamount, date, houseuuid } = input;

      try {
        const exist = await paymentDetails.findOne({ roomuuid: houseuuid });
        if (!exist) {
          throw new Error("invaild tenant");
        }
        const document = { payamount: payamount, date: date };
        const result = await paymentDetails.findOneAndUpdate(
          {
            roomuuid: houseuuid,
          },
          { $push: { paymentdetail: document } }
        );
        if (result) {
          return "done";
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    Riseissues: async (_, { input }, { user }) => {
      const tenantuuid = user;
      const { roomuuid, adminuuid, question } = input;
      const datentime = new Date().getTime();
      const uuid = uuidv4();
      try {
        const exist = await problems?.findOne({
          $or: [{ tenantuuid: tenantuuid }, { roomuuid: roomuuid }],
        });
        if (exist) {
          const document = {
            question: question,
            uuid: uuid,
            date: datentime,
            status: true,
            answer: [],
          };
          // throw new Error("issues already pending");
          const result = await problems?.findOneAndUpdate(
            {
              tenantuuid: tenantuuid,
            },
            { $push: { issues: document } }
          );
          if (result) {
            return "done";
          }
        }
        const document = {
          tenantuuid: tenantuuid,
          roomuuid: roomuuid,
          adminuuid: adminuuid,
          issues: [
            {
              question: question,
              uuid: uuid,
              date: datentime,
              status: true,
              answer: [],
            },
          ],
        };
        const result = await problems?.insertOne(document);
        if (result) {
          return "done";
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    replyIssues: async (_, { input }, { user }) => {
      const { questionuuid, answer } = input;
      const uuid = user;
      const datentime = new Date().getTime();
      try {
        const exist = await problems?.findOne({ "issues.uuid": questionuuid });
        if (!exist) {
          throw new Error("invaild issues");
        }
        const document = { who: uuid, ans: answer, date: datentime };
        const result = await problems?.findOneAndUpdate(
          {
            "issues.uuid": questionuuid,
          },
          { $push: { "issues.$.answer": document } }
        );
        if (result) {
          return "done";
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    deleteTenant: async (_, { input }) => {
      const { uuid } = input;
      try {
        const result = await rentaildetails.findOne({
          tenantuuid: uuid,
        });

        if (!result) {
          const finaly = await userdetails.findOneAndDelete({ uuid: uuid });
          if (finaly) {
            return "done";
          }
        }

        const userupdate = await rentaildetails.findOneAndUpdate(
          { tenantuuid: uuid },
          { $unset: { tenantuuid: "" } },
          { new: true }
        );

        if (userupdate || result) {
          return "done";
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    addnewcount: async (_, { input }) => {
      const { name, newcount } = input;
      const uuid = uuidv4();
      try {
        const exist = await roomDetails.findOne({ name: name });
        const length = exist?.detail?.length;
        if (!exist) {
          throw new error("invaild input");
        }
        const document = Array.from({ length: newcount }, (_, index) => ({
          name: `${name}-${index + 1 + length}`,
          uuid: `${uuid}-${name}-${index + 1 + length}`,
          tenantuuid: "null",
        }));
        document.forEach((roomName) => {
          exist.detail.push(roomName);
        });
        const valu = exist?.detail;
        const result = await roomDetails.findOneAndUpdate(
          { name: name },
          { $set: { detail: valu } }
        );
        if (result) {
          return "done";
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    addtentant: async (_, { input }) => {
      const uuid = uuidv4();
      const password = generateRandomString();
      try {
        const {
          name,
          phonenumber,
          email,
          roomuuid,
          status,
          startingdate,
          advancepayment,
          rentpermonth,
          type,
          doornumber,
        } = input;

        const document = {
          name: name,
          phonenumber: phonenumber,
          email: email,
          password: password,
          roomuuid: roomuuid,
          status: status,
          startingdate: startingdate,
          advancepayment: advancepayment,
          rentpermonth: rentpermonth,
          uuid: uuid,
          type: type,
          doornumber: doornumber,
        };
        const paydocument = {
          tenantuuid: uuid,
          roomuuid: roomuuid,
          paymentdetail: [],
        };
        const exist = await tenantDetails.findOne({ phonenumber: phonenumber });
        if (exist) {
          throw new Error("user already a tenant");
        }

        const adminuuid = "db547dcb-5f60-4b3b-b2c0-377237c39266";
        const addtenanttoroom = await roomDetails?.findOne({
          adminuuid: adminuuid,

          "roomDetail.name.detail.uuid": roomuuid,
        });
        console.log(addtenanttoroom);
        // const result = await tenantDetails.insertOne(document);
        // if (result) {
        //   const addrentpage = await paymentDetails.insertOne(paydocument);
        //   if (addrentpage) {
        //     const adminuuid = "db547dcb-5f60-4b3b-b2c0-377237c39266";
        //     const addtenanttoroom = await roomDetails?.findOneAndUpdate(
        //       {
        //         adminuuid: adminuuid,
        //         "roomDetail.name": type,
        //         "roomDetail.detail.uuid": uuid,
        //       },
        //       { $set: { "roomDetail.$.tenantuuid": uuid } }
        //     );
        //     if (addtenanttoroom) {
        //       return password;
        //     }
        //   }
        // }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    changepass: async (_, { input }) => {
      const { pathurl, password } = input;
      console.log(pathurl, password);

      const hashedpass = await bcrypt.hash(password, saltRound);
      try {
        const exist = await tenantDetails?.findOne({ password: pathurl });
        if (!exist) {
          throw new Error("Url Expired");
        }
        const result = await tenantDetails.findOneAndUpdate(
          { password: pathurl },
          { $set: { password: hashedpass } }
        );
        if (result) {
          return "done";
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    paymenttransaction: async (_, { input }, { user }) => {
      const uuid = user;
      const { roomuuid, codeword } = input;
      console.log(uuid, roomuuid, codeword);
      try {
        const exist = await paymentTransaction.findOne({ codeword: codeword });
        if (exist) {
          throw new Error("alredy exits");
        }
        const document = {
          tenantuuid: uuid,
          roomuuid: roomuuid,
          codeword: codeword,
          status: "pending",
        };
        const result = await paymentTransaction.insertOne(document);
        if (result?.insertedId) {
          return "done";
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    // updated
    noofRooms: async (_, { input }, { user }) => {
      const uuid = uuidv4();
      try {
        const exist = await roomDetails.find().toArray();
        const existArrays = exist.map((item) => item.name);
        const inputArrays = input?.data?.map((item) => item.name);
        inputArrays.forEach((item) => {
          if (existArrays.includes(item)) {
            throw new Error("already exists");
          }
        });
        const document = input?.data.map((item) => {
          const detail = Array.from(
            { length: Number(item.count) },
            (_, index) => ({
              name: `${item?.name}-${index + 1}`,
              uuid: `${uuid}-${item?.name}-${index + 1}`,
              tenantuuid: "null",
            })
          );
          return {
            name: item.name,
            detail,
          };
        });
        const documentfinal = { adminuuid: user, roomDetail: document };
        const result = await roomDetails.insertOne(documentfinal);
        if (result?.insertedId) {
          return "done";
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};
