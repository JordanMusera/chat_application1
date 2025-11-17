import { Dropdown, MenuProps } from "antd";
import { MoreOutlined } from "@ant-design/icons";

const items: MenuProps['items'] = [
  { key: "1", label: "Create group" },
  { key: "2", label: "Profile" },
];

const MyDropdown = () => (
  <Dropdown
    menu={{ items, className: "bg-gray-800 text-white text-lg" }}
    trigger={['click']}
    placement="bottomRight"
  >
    <MoreOutlined className="text-2xl cursor-pointer text-white" />
  </Dropdown>
);

export default MyDropdown;
