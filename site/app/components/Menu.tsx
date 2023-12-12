"use client";
import {Fragment, useState} from "react";
import {HeaderMenuQuery} from "@/tina/__generated__/types";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  headerMenu: HeaderMenuQuery;
  lang: string;
  logo: string;
}

type menuLink = {
  url?: string | null;
  isInteral?: boolean | null;
  localize?: boolean | null;
  label?: string | null;
  icon?: string | null;
  description?: string | null;
};

export const Header: React.FC<HeaderProps> = ({headerMenu, lang, logo}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const prependLangIfLocalizeTrue = (menuLink: menuLink) => {
    return menuLink.localize ? `/${lang}${menuLink.url}` : menuLink.url;
  };
  function settleLink(menuLink: menuLink, topIndex: number) {
    if (menuLink.isInteral) {
      return (
        <Link
          onFocus={() => setActiveIdx(topIndex)}
          onMouseOver={() => setActiveIdx(topIndex)}
          href={prependLangIfLocalizeTrue(menuLink)!}
        >
          {" "}
          {menuLink.label}{" "}
        </Link>
      );
    } else {
      return (
        <a
          onFocus={() => setActiveIdx(topIndex)}
          onMouseOver={() => setActiveIdx(topIndex)}
          href={prependLangIfLocalizeTrue(menuLink)!}
        >
          {menuLink.label}
        </a>
      );
    }
  }
  const links = headerMenu.headerMenu.menuLinks;
  if (!links) return "empty links";
  return (
    <div className="">
      <nav
        className="relative p-4 flex items-center justify-between"
        onBlur={() => setActiveIdx(null)}
        onMouseLeave={() => setActiveIdx(null)}
      >
        <span className="w-40 inline-block">
          <Link href="/">
            <Image src={logo} alt="WA logo" />
          </Link>
        </span>
        <ul className="flex list-none gap-4 p-0">
          {links.map((menuLink, topIndex) => {
            if (!menuLink) return "";
            return (
              <li key={menuLink.url} className="">
                <span className="inline-block px-2 hover:bg-primaryLighter rounded-md">
                  {settleLink(menuLink, topIndex)}
                </span>
                {menuLink.submenuItem && topIndex === activeIdx && (
                  <>
                    {menuLink.submenuItem.nestedMenu && (
                      <div className="bg-white top-full py-4 flex absolute left-0 w-full divide-[#E5E8EB] divide-x divide-solid divide-y-0">
                        <div className="p-4">
                          <h2>{menuLink.label}</h2>
                          <p>{menuLink.description}</p>
                        </div>
                        <div className="p-4 grid grid-cols-[repeat(auto-fit,minmax(175px,1fr))] gap-4 w-full">
                          {menuLink.submenuItem.nestedMenu.map((nested) => (
                            <div key={nested?.groupLabel}>
                              <span className="bold underline">
                                {nested?.groupLabel}
                              </span>
                              {nested?.submenuChildren?.map((children) => (
                                <Fragment key={children?.label}>
                                  <p>{children?.label}</p>
                                  <p>{children?.description}</p>
                                </Fragment>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {menuLink.submenuItem.subItem && (
                      <div className="bg-white py-4 top-full flex absolute left-0 w-full divide-[#E5E8EB] divide-x divide-solid divide-y-0">
                        <div className="p-4">
                          <h2>{menuLink.label}</h2>
                          <p>{menuLink.description}</p>
                        </div>
                        <div className="p-4 grid grid-cols-[repeat(auto-fit,minmax(175px,1fr))] gap-4 w-full">
                          {menuLink.submenuItem.subItem.map((subItem) => (
                            <div key={subItem?.label} className="py-2">
                              <span className="font-bold">
                                {subItem?.label}
                              </span>
                              <p>{subItem?.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Header;
