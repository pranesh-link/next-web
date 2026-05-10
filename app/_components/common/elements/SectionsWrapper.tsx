"use client";
import styled from "styled-components";
import { SecHeader } from "./Typography";

/** Top-level wrapper that arranges all profile sections; many `&.<variant>` modifiers. */
export const SectionsWrapper = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  height: 100%;
  padding: 0 20px 60px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  
  &.export {
    padding-left: 10%;
    margin-top: 0;
  }
  
  &.hamburger-menu {
    padding-left: 0;
    padding-bottom: 0;
    height: unset;
    padding: 0 10px;
    
    .profile-section {
      &.links {
        @media screen and (max-width: 767px) {
          display: flex;
        }
      }
    }
  }
  
  .profile-section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24px;
    margin-bottom: 32px;
    padding: 40px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all var(--transition-normal);
    opacity: 0;
    transform: translateY(30px);
    animation: fadeInUp 0.8s ease-out forwards;
    
    &:nth-child(1) { animation-delay: 0.1s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.3s; }
    &:nth-child(4) { animation-delay: 0.4s; }
    &:nth-child(5) { animation-delay: 0.5s; }
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
    }
    
    @media screen and (max-width: 768px) {
      margin-bottom: 24px;
      padding: 24px;
      border-radius: 20px;
    }
    
    > header {
      margin-bottom: 24px;
      
      @media screen and (max-width: 767px) {
        margin-bottom: 16px;
      }
    }
    
    .organization {
      margin: 0 auto;
      
      .org-name {
        text-align: center;
      }
    }

    &.links {
      padding: 24px;
      background: linear-gradient(135deg, rgba(34, 34, 34, 0.95) 0%, rgba(68, 68, 68, 0.95) 100%);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: fixed;
      bottom: 0;
      width: 100%;
      margin-bottom: 0;
      z-index: 2;
      &.export {
        position: static;
        background-color: transparent;
        @media screen and (max-width: 767px) {
          display: flex;
          position: static;
          padding: 20px 0;
          background-color: transparent;
        }
        .link {
          padding-right: 15px;
        }
      }

      .link {
        @media screen and (max-width: 767px) {
          margin-bottom: 0;
        }
        a {
          padding: 10px 15px;
          text-decoration: none;
          border-radius: 20px;
          background-color: #0c77b9;
          &:hover {
            background-color: #3f9c35;
          }
        }
        img {
          height: 25px;
          &.Github {
            @media screen and (max-width: 767px) {
              height: 28px;
            }
          }
        }
        a,
        span {
          color: #f0f0f0;
        }
        .link-separator {
          &:last-child {
            display: none;
          }
        }
      }
    }

    &.experience {
      &.export {
        background-color: transparent;
        padding-top: 0px;
      }
      ${SecHeader} {
        @media screen and (max-width: 767px) {
          margin-bottom: 10px;
        }
      }
      @media screen and (max-width: 767px) {
        background: none;
      }
    }
    &.about {
      padding-top: 20px;
      @media screen and (max-width: 767px) {
        flex-direction: column;
        justify-content: normal;
        &.export {
          flex-direction: row;
        }
      }
    }
    .image-details-wrap {
      margin-right: 10px;
      align-self: flex-end;
      @media screen and (max-width: 767px) {
        margin-top: 15px;
        align-items: normal;
        align-self: normal;
      }
    }
    .about-me {
      flex-basis: 25%;
      padding-right: 10px;
      &.export {
        flex-basis: 33%;
      }
    }
    .image {
      .image-wrap {
        margin-right: 50px;
        @media screen and (max-width: 767px) {
          margin-right: 20px;
        }
      }
      .profile-image {
        border-radius: 50%;
        border: 2px solid #dddbca;
      }
    }
    .details {
      min-width: 55%;
      .detail {
        padding-bottom: 5px;
      }
      .detail-info {
        line-height: 2;
        span {
          /* flex-basis: 75%; */
        }
      }
    }
  }
  @media screen and (max-width: 767px) {
    margin-top: 0;
    .profile-section {
      padding-left: 20px;
      padding-right: 10px;
      .organization {
        .org-name {
          text-align: left;
        }
      }
    }
  }
`;


