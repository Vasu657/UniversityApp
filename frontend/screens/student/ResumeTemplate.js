import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Dimensions, FlatList, Modal, ActivityIndicator, Text
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../utils/ip';

const { v4: uuidv4 } = require("uuid");
const { width } = Dimensions.get('window');

// A4 dimensions in pixels (72 DPI for PDF)
const A4_WIDTH = 595; // 210mm
const A4_HEIGHT = 842; // 297mm

// Resume Templates (Six advanced two-column layouts)
const templates = [
  {
    id: 'professional',
    name: 'Professional Two-Column',
    icon: 'document-outline',
    previewHeight: 220,
    generate: (profile, branch) => `
    <html>
    <head>
      <style>
        @page { size: A4; margin: 0; }
        body {
          font-family: 'Helvetica', sans-serif;
          margin: 0;
          padding: 20mm;
          background: #FFFFFF;
          color: #1E293B;
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          line-height: 1.6;
          font-size: 10pt;
        }
        .container {
          display: flex;
          height: 100%;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
        }
        .sidebar {
          width: 35%;
          padding: 20px;
          background: #F1F5F9;
          border-right: 1px solid #E5E7EB;
        }
        .main {
          width: 65%;
          padding: 20px;
        }
        .profile-img {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 15px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .header {
          margin-bottom: 15px;
          text-align: center;
        }
        .header h1 {
          font-size: 22pt;
          color: #1E40AF;
          margin: 0;
          font-weight: bold;
        }
        .header p {
          font-size: 9pt;
          color: #64748B;
          margin: 3px 0;
        }
        .social-links {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 10px;
        }
        .social-icon {
          width: 20px;
          height: 20px;
          display: inline-block;
        }
        .social-icon svg {
          width: 100%;
          height: 100%;
          fill: #1E40AF;
          transition: fill 0.3s ease;
        }
        .social-icon:hover svg {
          fill: #1E293B;
        }
        .section {
          margin-bottom: 15px;
        }
        .section h2 {
          font-size: 14pt;
          color: #1E293B;
          border-bottom: 2px solid #1E40AF;
          padding-bottom: 4px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .item {
          margin-bottom: 12px;
        }
        .item h3 {
          font-size: 11pt;
          color: #1E293B;
          margin: 0;
          font-weight: bold;
        }
        .item p {
          font-size: 9pt;
          color: #64748B;
          margin: 3px 0;
        }
        .skills-list {
          list-style: none;
          padding: 0;
          font-size: 9pt;
        }
        .skills-list li {
          margin-bottom: 5px;
          color: #1E293B;
        }
        a {
          color: #1E40AF;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="sidebar">
          ${profile.personal_details.profile_photo ? `
            <img src="${profile.personal_details.profile_photo}" class="profile-img" alt="Profile Photo" />
          ` : ''}
          <div class="header">
            <h1>${profile.personal_details.full_name || 'Your Name'}</h1>
            <p>${profile.personal_details.email || ''}</p>
            <p>${profile.personal_details.phone || ''}</p>
            <p>${profile.personal_details.address || ''}</p>
            
            <div class="social-links">
              ${profile.personal_details.linkedin_url ? `
                <a href="${profile.personal_details.linkedin_url}" class="social-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              ` : ''}
              ${profile.personal_details.github_url ? `
                <a href="${profile.personal_details.github_url}" class="social-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              ` : ''}
            </div>
          </div>
          <div class="section">
            <h2>Skills</h2>
            <ul class="skills-list">
              ${profile.skills.map(skill => `<li>${skill.skill_name} (${skill.proficiency_level})</li>`).join('')}
            </ul>
          </div>
          <div class="section">
            <h2>Languages</h2>
            <ul class="skills-list">
              ${profile.languages.map(lang => `<li>${lang.language_name} (${lang.proficiency_level})</li>`).join('')}
            </ul>
          </div>
          <div class="section">
            <h2>Hobbies</h2>
            <p>${profile.hobbies.map(hobby => hobby.hobby_name).join(', ') || 'N/A'}</p>
          </div>
          <div class="section">
            <h2>Achievements</h2>
            ${profile.achievements.map(ach => `
              <div class="item">
                <h3>${ach.title || ''}</h3>
                <p>${ach.description || ''} | ${ach.date || ''}</p>
              </div>
            `).join('')}
          </div>
          <div class="section">
            <h2>References</h2>
            ${profile.resume_references.map(ref => `
              <div class="item">
                <h3>${ref.reference_name || ''}</h3>
                <p>${ref.relation || ''} | ${ref.contact_info || ''}</p>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="main">
          ${profile.personal_details.objective ? `
          <div class="section">
            <h2>Objective</h2>
            <p>${profile.personal_details.objective}</p>
          </div>` : ''}
          <div class="section">
            <h2>Education</h2>
            ${profile.education.map(edu => `
              <div class="item">
                <h3>${edu.institution_name || ''}</h3>
                <p>${edu.degree || ''}, ${edu.branch || ''}</p>
                <p>${edu.start_year || ''} - ${edu.end_year || ''}</p>
                <p>Grade: ${edu.grade || 'N/A'}</p>
              </div>
            `).join('')}
          </div>
          <div class="section">
            <h2>Experience</h2>
            ${profile.work_experience.map(exp => `
              <div class="item">
                <h3>${exp.role || ''} at ${exp.company_name || ''}</h3>
                <p>${exp.start_date || ''} - ${exp.is_current ? 'Present' : exp.end_date || ''}</p>
                <p>${exp.description || ''}</p>
              </div>
            `).join('')}
          </div>
          <div class="section">
            <h2>Projects</h2>
            ${profile.projects.map(proj => `
              <div class="item">
                <h3>${proj.project_title || ''}</h3>
                <p>Technologies: ${proj.technologies_used || ''}</p>
                <p>${proj.description || ''}</p>
                ${proj.project_link ? `<p><a href="${proj.project_link}">Project Link</a></p>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="section">
            <h2>Certifications</h2>
            ${profile.certifications.map(cert => `
              <div class="item">
                <h3>${cert.certificate_name || ''}</h3>
                <p>${cert.issuing_organization || ''} | ${cert.issue_date || ''}</p>
                ${cert.certificate_link ? `<p><a href="${cert.certificate_link}">Certificate Link</a></p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  },
  // Template 2: Modern Green Two-Column
{
  id: 'modern-green',
  name: 'Modern Green Two-Column',
  icon: 'leaf-outline',
  previewHeight: 220,
  generate: (profile, branch) => `
  <html>
  <head>
    <style>
      @page { size: A4; margin: 0; }
      body {
        font-family: 'Helvetica', sans-serif;
        margin: 0;
        padding: 20mm;
        background: #FFFFFF;
        color: #1F2937;
        width: 210mm;
        height: 297mm;
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 10pt;
      }
      .container {
        display: flex;
        height: 100%;
        background: #FFFFFF;
        border: 1px solid #D1FAE5;
        border-radius: 12px;
        overflow: hidden;
      }
      .sidebar {
        width: 35%;
        padding: 20px;
        background: linear-gradient(135deg, #065F46 0%, #047857 100%);
        color: #FFFFFF;
      }
      .main {
        width: 65%;
        padding: 20px;
        background: #FFFFFF;
      }
      .profile-img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 15px;
        display: block;
        margin-left: auto;
        margin-right: auto;
        border: 3px solid #10B981;
      }
      .header {
        margin-bottom: 15px;
        text-align: center;
      }
      .header h1 {
        font-size: 22pt;
        color: #FFFFFF;
        margin: 0;
        font-weight: bold;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header p {
        font-size: 9pt;
        color: #D1FAE5;
        margin: 3px 0;
      }
      .social-links {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-top: 10px;
      }
      .social-icon {
        width: 20px;
        height: 20px;
        display: inline-block;
      }
      .social-icon svg {
        width: 100%;
        height: 100%;
        fill: #10B981;
        transition: fill 0.3s ease;
      }
      .social-icon:hover svg {
        fill: #FFFFFF;
      }
      .section {
        margin-bottom: 15px;
      }
      .sidebar .section h2 {
        font-size: 14pt;
        color: #FFFFFF;
        border-bottom: 2px solid #10B981;
        padding-bottom: 4px;
        margin-bottom: 8px;
        text-transform: uppercase;
        font-weight: bold;
      }
      .main .section h2 {
        font-size: 14pt;
        color: #065F46;
        border-bottom: 2px solid #10B981;
        padding-bottom: 4px;
        margin-bottom: 8px;
        text-transform: uppercase;
        font-weight: bold;
      }
      .item {
        margin-bottom: 12px;
      }
      .sidebar .item h3 {
        font-size: 11pt;
        color: #FFFFFF;
        margin: 0;
        font-weight: bold;
      }
      .main .item h3 {
        font-size: 11pt;
        color: #065F46;
        margin: 0;
        font-weight: bold;
      }
      .sidebar .item p {
        font-size: 9pt;
        color: #D1FAE5;
        margin: 3px 0;
      }
      .main .item p {
        font-size: 9pt;
        color: #6B7280;
        margin: 3px 0;
      }
      .skills-list {
        list-style: none;
        padding: 0;
        font-size: 9pt;
      }
      .skills-list li {
        margin-bottom: 5px;
        color: #D1FAE5;
        position: relative;
        padding-left: 15px;
      }
      .skills-list li:before {
        content: "▶";
        color: #10B981;
        position: absolute;
        left: 0;
      }
      a {
        color: #10B981;
        text-decoration: none;
      }
      .main a {
        color: #047857;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="sidebar">
        ${profile.personal_details.profile_photo ? `
          <img src="${profile.personal_details.profile_photo}" class="profile-img" alt="Profile Photo" />
        ` : ''}
        <div class="header">
          <h1>${profile.personal_details.full_name || 'Your Name'}</h1>
          <p>${profile.personal_details.email || ''}</p>
          <p>${profile.personal_details.phone || ''}</p>
          <p>${profile.personal_details.address || ''}</p>
          
          <div class="social-links">
            ${profile.personal_details.linkedin_url ? `
              <a href="${profile.personal_details.linkedin_url}" class="social-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            ` : ''}
            ${profile.personal_details.github_url ? `
              <a href="${profile.personal_details.github_url}" class="social-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            ` : ''}
          </div>
        </div>
        <div class="section">
          <h2>Skills</h2>
          <ul class="skills-list">
            ${profile.skills.map(skill => `<li>${skill.skill_name} (${skill.proficiency_level})</li>`).join('')}
          </ul>
        </div>
        <div class="section">
          <h2>Languages</h2>
          <ul class="skills-list">
            ${profile.languages.map(lang => `<li>${lang.language_name} (${lang.proficiency_level})</li>`).join('')}
          </ul>
        </div>
        <div class="section">
          <h2>Hobbies</h2>
          <p>${profile.hobbies.map(hobby => hobby.hobby_name).join(', ') || 'N/A'}</p>
        </div>
        <div class="section">
          <h2>Achievements</h2>
          ${profile.achievements.map(ach => `
            <div class="item">
              <h3>${ach.title || ''}</h3>
              <p>${ach.description || ''} | ${ach.date || ''}</p>
            </div>
          `).join('')}
        </div>
        <div class="section">
          <h2>References</h2>
          ${profile.resume_references.map(ref => `
            <div class="item">
              <h3>${ref.reference_name || ''}</h3>
              <p>${ref.relation || ''} | ${ref.contact_info || ''}</p>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="main">
        ${profile.personal_details.objective ? `
        <div class="section">
          <h2>Objective</h2>
          <p>${profile.personal_details.objective}</p>
        </div>` : ''}
        <div class="section">
          <h2>Education</h2>
          ${profile.education.map(edu => `
            <div class="item">
              <h3>${edu.institution_name || ''}</h3>
              <p>${edu.degree || ''}, ${edu.branch || ''}</p>
              <p>${edu.start_year || ''} - ${edu.end_year || ''}</p>
              <p>Grade: ${edu.grade || 'N/A'}</p>
            </div>
          `).join('')}
        </div>
        <div class="section">
          <h2>Experience</h2>
          ${profile.work_experience.map(exp => `
            <div class="item">
              <h3>${exp.role || ''} at ${exp.company_name || ''}</h3>
              <p>${exp.start_date || ''} - ${exp.is_current ? 'Present' : exp.end_date || ''}</p>
              <p>${exp.description || ''}</p>
            </div>
          `).join('')}
        </div>
        <div class="section">
          <h2>Projects</h2>
          ${profile.projects.map(proj => `
            <div class="item">
              <h3>${proj.project_title || ''}</h3>
              <p>Technologies: ${proj.technologies_used || ''}</p>
              <p>${proj.description || ''}</p>
              ${proj.project_link ? `<p><a href="${proj.project_link}">Project Link</a></p>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="section">
          <h2>Certifications</h2>
          ${profile.certifications.map(cert => `
            <div class="item">
              <h3>${cert.certificate_name || ''}</h3>
              <p>${cert.issuing_organization || ''} | ${cert.issue_date || ''}</p>
              ${cert.certificate_link ? `<p><a href="${cert.certificate_link}">Certificate Link</a></p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </body>
  </html>
`,
},

// Template 3: Executive Purple Two-Column
{
  id: 'executive-purple',
  name: 'Executive Purple Two-Column',
  icon: 'business-outline',
  previewHeight: 220,
  generate: (profile, branch) => `
  <html>
  <head>
    <style>
      @page { size: A4; margin: 0; }
      body {
        font-family: 'Helvetica', sans-serif;
        margin: 0;
        padding: 20mm;
        background: #FFFFFF;
        color: #1F2937;
        width: 210mm;
        height: 297mm;
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 10pt;
      }
      .container {
        display: flex;
        height: 100%;
        background: #FFFFFF;
        border: 1px solid #E0E7FF;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(79, 70, 229, 0.1);
      }
      .sidebar {
        width: 35%;
        padding: 20px;
        background: linear-gradient(135deg, #4C1D95 0%, #6366F1 100%);
        color: #FFFFFF;
        position: relative;
      }
      .sidebar::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        height: 60px;
        background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
      }
      .main {
        width: 65%;
        padding: 20px;
        background: #FAFBFF;
      }
      .profile-img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 15px;
        display: block;
        margin-left: auto;
        margin-right: auto;
        border: 3px solid #8B5CF6;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      }
      .header {
        margin-bottom: 15px;
        text-align: center;
        position: relative;
        z-index: 1;
      }
      .header h1 {
        font-size: 22pt;
        color: #FFFFFF;
        margin: 0;
        font-weight: bold;
        text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        letter-spacing: 1px;
      }
      .header p {
        font-size: 9pt;
        color: #E0E7FF;
        margin: 3px 0;
      }
      .social-links {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-top: 10px;
      }
      .social-icon {
        width: 20px;
        height: 20px;
        display: inline-block;
        padding: 8px;
        background: rgba(255,255,255,0.1);
        border-radius: 50%;
        transition: all 0.3s ease;
      }
      .social-icon:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-2px);
      }
      .social-icon svg {
        width: 100%;
        height: 100%;
        fill: #A5B4FC;
        transition: fill 0.3s ease;
      }
      .social-icon:hover svg {
        fill: #FFFFFF;
      }
      .section {
        margin-bottom: 15px;
      }
      .sidebar .section h2 {
        font-size: 14pt;
        color: #FFFFFF;
        border-bottom: 2px solid #8B5CF6;
        padding-bottom: 4px;
        margin-bottom: 8px;
        text-transform: uppercase;
        font-weight: bold;
        letter-spacing: 0.5px;
      }
      .main .section h2 {
        font-size: 14pt;
        color: #4C1D95;
        border-bottom: 2px solid #8B5CF6;
        padding-bottom: 4px;
        margin-bottom: 8px;
        text-transform: uppercase;
        font-weight: bold;
        letter-spacing: 0.5px;
      }
      .item {
        margin-bottom: 12px;
        position: relative;
      }
      .sidebar .item h3 {
        font-size: 11pt;
        color: #FFFFFF;
        margin: 0;
        font-weight: bold;
      }
      .main .item h3 {
        font-size: 11pt;
        color: #4C1D95;
        margin: 0;
        font-weight: bold;
      }
      .sidebar .item p {
        font-size: 9pt;
        color: #E0E7FF;
        margin: 3px 0;
      }
      .main .item p {
        font-size: 9pt;
        color: #6B7280;
        margin: 3px 0;
      }
      .skills-list {
        list-style: none;
        padding: 0;
        font-size: 9pt;
      }
      .skills-list li {
        margin-bottom: 8px;
        color: #E0E7FF;
        position: relative;
        padding: 6px 0 6px 20px;
        background: rgba(255,255,255,0.05);
        border-radius: 4px;
        margin-bottom: 4px;
      }
      .skills-list li:before {
        content: "●";
        color: #8B5CF6;
        position: absolute;
        left: 8px;
        font-size: 12pt;
      }
      a {
        color: #8B5CF6;
        text-decoration: none;
        transition: color 0.3s ease;
      }
      a:hover {
        color: #A5B4FC;
      }
      .main a {
        color: #6366F1;
      }
      .main a:hover {
        color: #4C1D95;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="sidebar">
        ${profile.personal_details.profile_photo ? `
          <img src="${profile.personal_details.profile_photo}" class="profile-img" alt="Profile Photo" />
        ` : ''}
        <div class="header">
          <h1>${profile.personal_details.full_name || 'Your Name'}</h1>
          <p>${profile.personal_details.email || ''}</p>
          <p>${profile.personal_details.phone || ''}</p>
          
          <div class="social-links">
            ${profile.personal_details.linkedin_url ? `
              <a href="${profile.personal_details.linkedin_url}" class="social-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            ` : ''}
            ${profile.personal_details.github_url ? `
              <a href="${profile.personal_details.github_url}" class="social-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            ` : ''}
          </div>
        </div>
        <div class="section">
          <h2>Skills</h2>
          <ul class="skills-list">
            ${profile.skills.map(skill => `<li>${skill.skill_name} (${skill.proficiency_level})</li>`).join('')}
          </ul>
        </div>
        <div class="section">
          <h2>Languages</h2>
          <ul class="skills-list">
            ${profile.languages.map(lang => `<li>${lang.language_name} (${lang.proficiency_level})</li>`).join('')}
          </ul>
        </div>
        <div class="section">
          <h2>Hobbies</h2>
          <p>${profile.hobbies.map(hobby => hobby.hobby_name).join(', ') || 'N/A'}</p>
        </div>
        <div class="section">
          <h2>Achievements</h2>
          ${profile.achievements.map(ach => `
            <div class="item">
              <h3>${ach.title || ''}</h3>
              <p>${ach.description || ''} | ${ach.date || ''}</p>
            </div>
          `).join('')}
        </div>
        <div class="section">
          <h2>References</h2>
          ${profile.resume_references.map(ref => `
            <div class="item">
              <h3>${ref.reference_name || ''}</h3>
              <p>${ref.relation || ''} | ${ref.contact_info || ''}</p>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="main">
        ${profile.personal_details.objective ? `
        <div class="section">
          <h2>Objective</h2>
          <p>${profile.personal_details.objective}</p>
        </div>` : ''}
        <div class="section">
          <h2>Education</h2>
          ${profile.education.map(edu => `
            <div class="item">
              <h3>${edu.institution_name || ''}</h3>
              <p>${edu.degree || ''}, ${edu.branch || ''}</p>
              <p>${edu.start_year || ''} - ${edu.end_year || ''}</p>
              <p>Grade: ${edu.grade || 'N/A'}</p>
            </div>
          `).join('')}
        </div>
        <div class="section">
          <h2>Experience</h2>
          ${profile.work_experience.map(exp => `
            <div class="item">
              <h3>${exp.role || ''} at ${exp.company_name || ''}</h3>
              <p>${exp.start_date || ''} - ${exp.is_current ? 'Present' : exp.end_date || ''}</p>
              <p>${exp.description || ''}</p>
            </div>
          `).join('')}
        </div>
        <div class="section">
          <h2>Projects</h2>
          ${profile.projects.map(proj => `
            <div class="item">
              <h3>${proj.project_title || ''}</h3>
              <p>Technologies: ${proj.technologies_used || ''}</p>
              <p>${proj.description || ''}</p>
              ${proj.project_link ? `<p><a href="${proj.project_link}">Project Link</a></p>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="section">
          <h2>Certifications</h2>
          ${profile.certifications.map(cert => `
            <div class="item">
              <h3>${cert.certificate_name || ''}</h3>
              <p>${cert.issuing_organization || ''} | ${cert.issue_date || ''}</p>
              ${cert.certificate_link ? `<p><a href="${cert.certificate_link}">Certificate Link</a></p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </body>
  </html>
`,
},
{
  id: 'executive',
  name: 'Executive Professional',
  icon: 'briefcase-outline',
  previewHeight: 220,
  generate: (profile, branch) => `
  <html>
  <head>
    <style>
      @page { size: A4; margin: 0; }
      body {
        font-family: 'Times New Roman', serif;
        margin: 0;
        padding: 20mm;
        background: #FFFFFF;
        color: #2C3E50;
        width: 210mm;
        height: 297mm;
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 11pt;
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #34495E;
        padding-bottom: 25px;
        margin-bottom: 30px;
      }
      .header h1 {
        font-size: 26pt;
        color: #2C3E50;
        margin: 0;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 3px;
      }
      .header .title {
        font-size: 13pt;
        color: #7F8C8D;
        margin: 10px 0;
        font-style: italic;
      }
      .contact-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin: 15px 0;
        flex-wrap: wrap;
      }
      .contact-item {
        font-size: 10pt;
        color: #34495E;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .social-links {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-top: 15px;
      }
      .social-icon {
        width: 24px;
        height: 24px;
        display: inline-block;
      }
      .social-icon svg {
        width: 100%;
        height: 100%;
        fill: #34495E;
        transition: fill 0.3s ease;
      }
      .social-icon:hover svg {
        fill: #2C3E50;
      }
      .section {
        margin-bottom: 25px;
      }
      .section-header {
        font-size: 16pt;
        color: #2C3E50;
        border-bottom: 1px solid #BDC3C7;
        padding-bottom: 8px;
        margin-bottom: 15px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .item {
        margin-bottom: 18px;
        padding-left: 15px;
        border-left: 3px solid #ECF0F1;
      }
      .item-title {
        font-size: 12pt;
        color: #2C3E50;
        font-weight: bold;
        margin-bottom: 3px;
      }
      .item-company {
        font-size: 11pt;
        color: #34495E;
        font-style: italic;
        margin-bottom: 3px;
      }
      .item-date {
        font-size: 10pt;
        color: #7F8C8D;
        margin-bottom: 8px;
      }
      .item-description {
        font-size: 10pt;
        color: #2C3E50;
        line-height: 1.5;
        text-align: justify;
      }
      .skills-list {
        columns: 2;
        column-gap: 30px;
        list-style: none;
        padding: 0;
      }
      .skills-list li {
        font-size: 10pt;
        color: #2C3E50;
        margin-bottom: 5px;
        break-inside: avoid;
      }
      .skills-list li:before {
        content: "▪ ";
        color: #34495E;
        font-weight: bold;
      }
      .objective {
        font-style: italic;
        font-size: 11pt;
        color: #34495E;
        text-align: justify;
        line-height: 1.6;
        margin-bottom: 25px;
        padding: 15px;
        border-left: 4px solid #3498DB;
        background: #F8F9FA;
      }
      .languages-list {
        columns: 2;
        column-gap: 30px;
        list-style: none;
        padding: 0;
      }
      .languages-list li {
        font-size: 10pt;
        color: #2C3E50;
        margin-bottom: 5px;
        break-inside: avoid;
      }
      .languages-list li:before {
        content: "• ";
        color: #7F8C8D;
        font-weight: bold;
      }
      .hobbies-text {
        font-size: 10pt;
        color: #2C3E50;
        line-height: 1.5;
      }
      a {
        color: #3498DB;
        text-decoration: none;
      }
      a:hover {
        color: #2980B9;
        text-decoration: underline;
      }
      .two-column {
        display: flex;
        gap: 30px;
        margin-bottom: 25px;
      }
      .column {
        flex: 1;
      }
      .compact-item {
        margin-bottom: 12px;
        padding-left: 10px;
        border-left: 2px solid #ECF0F1;
      }
      .compact-item h3 {
        font-size: 11pt;
        color: #2C3E50;
        margin: 0 0 3px 0;
        font-weight: bold;
      }
      .compact-item p {
        font-size: 9pt;
        color: #7F8C8D;
        margin: 2px 0;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${profile.personal_details.full_name || 'Your Name'}</h1>
      
      <div class="contact-row">
        ${profile.personal_details.email ? `
          <div class="contact-item">
            <span>📧</span>
            <span>${profile.personal_details.email}</span>
          </div>
        ` : ''}
        ${profile.personal_details.phone ? `
          <div class="contact-item">
            <span>📞</span>
            <span>${profile.personal_details.phone}</span>
          </div>
        ` : ''}
        ${profile.personal_details.address ? `
          <div class="contact-item">
            <span>📍</span>
            <span>${profile.personal_details.address}</span>
          </div>
        ` : ''}
      </div>

      <div class="social-links">
        ${profile.personal_details.linkedin_url ? `
          <a href="${profile.personal_details.linkedin_url}" class="social-icon">
            <svg viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        ` : ''}
        ${profile.personal_details.github_url ? `
          <a href="${profile.personal_details.github_url}" class="social-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        ` : ''}
      </div>
    </div>

    ${profile.personal_details.objective ? `
    <div class="objective">
      ${profile.personal_details.objective}
    </div>` : ''}

    <div class="section">
      <h2 class="section-header">Professional Experience</h2>
      ${profile.work_experience.map(exp => `
        <div class="item">
          <div class="item-title">${exp.role || ''}</div>
          <div class="item-company">${exp.company_name || ''}</div>
          <div class="item-date">${exp.start_date || ''} - ${exp.is_current ? 'Present' : exp.end_date || ''}</div>
          <div class="item-description">${exp.description || ''}</div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2 class="section-header">Education</h2>
      ${profile.education.map(edu => `
        <div class="item">
          <div class="item-title">${edu.degree || ''}, ${edu.branch || ''}</div>
          <div class="item-company">${edu.institution_name || ''}</div>
          <div class="item-date">${edu.start_year || ''} - ${edu.end_year || ''}</div>
          <div class="item-description">Grade: ${edu.grade || 'N/A'}</div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2 class="section-header">Core Competencies</h2>
      <ul class="skills-list">
        ${profile.skills.map(skill => `<li>${skill.skill_name} (${skill.proficiency_level})</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2 class="section-header">Key Projects</h2>
      ${profile.projects.map(proj => `
        <div class="item">
          <div class="item-title">${proj.project_title || ''}</div>
          <div class="item-company">Technologies: ${proj.technologies_used || ''}</div>
          <div class="item-description">${proj.description || ''}</div>
          ${proj.project_link ? `<p><a href="${proj.project_link}">Project Link</a></p>` : ''}
        </div>
      `).join('')}
    </div>

    ${profile.certifications && profile.certifications.length > 0 ? `
    <div class="section">
      <h2 class="section-header">Certifications</h2>
      ${profile.certifications.map(cert => `
        <div class="item">
          <div class="item-title">${cert.certificate_name || ''}</div>
          <div class="item-company">${cert.issuing_organization || ''}</div>
          <div class="item-date">${cert.issue_date || ''}</div>
          ${cert.certificate_link ? `<div class="item-description"><a href="${cert.certificate_link}">Certificate Link</a></div>` : ''}
        </div>
      `).join('')}
    </div>` : ''}

    <div class="two-column">
      ${profile.languages && profile.languages.length > 0 ? `
      <div class="column">
        <div class="section">
          <h2 class="section-header">Languages</h2>
          <ul class="languages-list">
            ${profile.languages.map(lang => `<li>${lang.language_name} (${lang.proficiency_level})</li>`).join('')}
          </ul>
        </div>
      </div>` : ''}
      
      ${profile.hobbies && profile.hobbies.length > 0 ? `
      <div class="column">
        <div class="section">
          <h2 class="section-header">Interests & Hobbies</h2>
          <div class="hobbies-text">${profile.hobbies.map(hobby => hobby.hobby_name).join(', ')}</div>
        </div>
      </div>` : ''}
    </div>

    ${profile.achievements && profile.achievements.length > 0 ? `
    <div class="section">
      <h2 class="section-header">Achievements</h2>
      ${profile.achievements.map(ach => `
        <div class="compact-item">
          <h3>${ach.title || ''}</h3>
          <p>${ach.description || ''} | ${ach.date || ''}</p>
        </div>
      `).join('')}
    </div>` : ''}

    ${profile.resume_references && profile.resume_references.length > 0 ? `
    <div class="section">
      <h2 class="section-header">References</h2>
      ${profile.resume_references.map(ref => `
        <div class="compact-item">
          <h3>${ref.reference_name || ''}</h3>
          <p>${ref.relation || ''} | ${ref.contact_info || ''}</p>
        </div>
      `).join('')}
    </div>` : ''}
  </body>
  </html>
  `,
},
{
  id: 'clean-professional',
  name: 'Clean Professional Two-Column',
  icon: 'document-text-outline',
  previewHeight: 220,
  generate: (profile, branch) => `
    <html>
    <head>
      <style>
        @page { size: A4; margin: 0; }
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 15mm;
          background: #FFFFFF;
          color: #2D3748;
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          line-height: 1.5;
          font-size: 10pt;
        }
        .container {
          display: flex;
          height: 100%;
          gap: 20px;
        }
        .left-column {
          width: 30%;
          background: #F7FAFC;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
        }
        .right-column {
          width: 70%;
          padding: 20px 0;
        }
        .profile-section {
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 2px solid #E2E8F0;
        }
        .profile-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 10px;
          border: 2px solid #4299E1;
        }
        .name {
          font-size: 18pt;
          font-weight: bold;
          color: #2D3748;
          margin-bottom: 5px;
        }
        .contact-info {
          font-size: 8pt;
          color: #718096;
          margin: 2px 0;
        }
        .section-title {
          font-size: 12pt;
          font-weight: bold;
          color: #4299E1;
          margin: 20px 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #4299E1;
          padding-bottom: 3px;
        }
        .main-section-title {
          font-size: 14pt;
          font-weight: bold;
          color: #2D3748;
          margin: 25px 0 15px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #4299E1;
          padding-bottom: 5px;
        }
        .skill-item {
          font-size: 9pt;
          color: #4A5568;
          margin-bottom: 8px;
          padding: 5px 10px;
          background: #EDF2F7;
          border-radius: 15px;
          display: inline-block;
          margin-right: 5px;
          margin-bottom: 5px;
        }
        .experience-item, .education-item, .project-item {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #E2E8F0;
        }
        .experience-item:last-child, .education-item:last-child, .project-item:last-child {
          border-bottom: none;
        }
        .item-title {
          font-size: 11pt;
          font-weight: bold;
          color: #2D3748;
          margin-bottom: 3px;
        }
        .item-company {
          font-size: 10pt;
          color: #4299E1;
          font-weight: 600;
          margin-bottom: 3px;
        }
        .item-date {
          font-size: 9pt;
          color: #718096;
          margin-bottom: 8px;
          font-style: italic;
        }
        .item-description {
          font-size: 9pt;
          color: #4A5568;
          line-height: 1.4;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .objective-text {
          font-size: 10pt;
          color: #4A5568;
          line-height: 1.5;
          text-align: justify;
          font-style: italic;
          padding: 15px;
          background: #EBF8FF;
          border-left: 3px solid #4299E1;
          border-radius: 5px;
        }
        .language-item, .hobby-item {
          font-size: 9pt;
          color: #4A5568;
          margin-bottom: 5px;
          padding-left: 15px;
          position: relative;
        }
        .language-item:before, .hobby-item:before {
          content: "●";
          color: #4299E1;
          position: absolute;
          left: 0;
        }
        .social-links {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
        }
        .social-icon {
          width: 16px;
          height: 16px;
          display: inline-block;
        }
        .social-icon svg {
          width: 100%;
          height: 100%;
          fill: #4299E1;
        }
        a {
          color: #4299E1;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="left-column">
          <div class="profile-section">
            ${profile.personal_details.profile_photo ? `
              <img src="${profile.personal_details.profile_photo}" class="profile-img" alt="Profile Photo" />
            ` : ''}
            <div class="name">${profile.personal_details.full_name || 'Your Name'}</div>
            ${profile.personal_details.email ? `<div class="contact-info">${profile.personal_details.email}</div>` : ''}
            ${profile.personal_details.phone ? `<div class="contact-info">${profile.personal_details.phone}</div>` : ''}
            ${profile.personal_details.address ? `<div class="contact-info">${profile.personal_details.address}</div>` : ''}
            
            <div class="social-links">
              ${profile.personal_details.linkedin_url ? `
                <a href="${profile.personal_details.linkedin_url}" class="social-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              ` : ''}
              ${profile.personal_details.github_url ? `
                <a href="${profile.personal_details.github_url}" class="social-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              ` : ''}
            </div>
          </div>

          <div>
            <h3 class="section-title">Skills</h3>
            <div class="skills-container">
              ${profile.skills.map(skill => `<span class="skill-item">${skill.skill_name}</span>`).join('')}
            </div>
          </div>

          ${profile.languages && profile.languages.length > 0 ? `
            <div>
              <h3 class="section-title">Languages</h3>
              ${profile.languages.map(lang => `<div class="language-item">${lang.language_name} (${lang.proficiency_level})</div>`).join('')}
            </div>
          ` : ''}

          ${profile.hobbies && profile.hobbies.length > 0 ? `
            <div>
              <h3 class="section-title">Interests</h3>
              ${profile.hobbies.map(hobby => `<div class="hobby-item">${hobby.hobby_name}</div>`).join('')}
            </div>
          ` : ''}

          ${profile.certifications && profile.certifications.length > 0 ? `
            <div>
              <h3 class="section-title">Certifications</h3>
              ${profile.certifications.map(cert => `
                <div style="margin-bottom: 10px;">
                  <div style="font-size: 9pt; font-weight: bold; color: #2D3748;">${cert.certificate_name || ''}</div>
                  <div style="font-size: 8pt; color: #718096;">${cert.issuing_organization || ''}</div>
                  <div style="font-size: 8pt; color: #718096;">${cert.issue_date || ''}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

                    ${profile.achievements && profile.achievements.length > 0 ? `
            <div>
              <h2 class="main-section-title">Achievements</h2>
              ${profile.achievements.map(ach => `
                <div class="project-item">
                  <div class="item-title">${ach.title || ''}</div>
                  <div class="item-date">${ach.date || ''}</div>
                  <div class="item-description">${ach.description || ''}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          q 
        </div>

        <div class="right-column">
          ${profile.personal_details.objective ? `
            <div style="margin-bottom: 25px;">
              <h2 class="main-section-title">Professional Summary</h2>
              <div class="objective-text">${profile.personal_details.objective}</div>
            </div>
          ` : ''}

          <div>
            <h2 class="main-section-title">Professional Experience</h2>
            ${profile.work_experience.map(exp => `
              <div class="experience-item">
                <div class="item-title">${exp.role || ''}</div>
                <div class="item-company">${exp.company_name || ''}</div>
                <div class="item-date">${exp.start_date || ''} - ${exp.is_current ? 'Present' : exp.end_date || ''}</div>
                <div class="item-description">${exp.description || ''}</div>
              </div>
            `).join('')}
          </div>

          <div>
            <h2 class="main-section-title">Education</h2>
            ${profile.education.map(edu => `
              <div class="education-item">
                <div class="item-title">${edu.degree || ''}, ${edu.branch || ''}</div>
                <div class="item-company">${edu.institution_name || ''}</div>
                <div class="item-date">${edu.start_year || ''} - ${edu.end_year || ''}</div>
                <div class="item-description">Grade: ${edu.grade || 'N/A'}</div>
              </div>
            `).join('')}
          </div>

          ${profile.projects && profile.projects.length > 0 ? `
            <div>
              <h2 class="main-section-title">Key Projects</h2>
              ${profile.projects.map(proj => `
                <div class="project-item">
                  <div class="item-title">${proj.project_title || ''}</div>
                  <div class="item-company">Technologies: ${proj.technologies_used || ''}</div>
                  <div class="item-description">${proj.description || ''}</div>
                  ${proj.project_link ? `<div style="margin-top: 5px;"><a href="${proj.project_link}">View Project</a></div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}


        </div>
      </div>
    </body>
    </html>
  `,
},

];

export default function ResumeTemplate({ route }) {
  const { user } = route.params;
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewType, setPreviewType] = useState(null);
  const [resumeHtml, setResumeHtml] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = response.data.profile;
        const parsedProfile = {
          personal_details: typeof profileData.personal_details === 'string'
            ? JSON.parse(profileData.personal_details)
            : profileData.personal_details || {},
          education: typeof profileData.education === 'string'
            ? JSON.parse(profileData.education)
            : profileData.education || [],
          skills: typeof profileData.skills === 'string'
            ? JSON.parse(profileData.skills)
            : profileData.skills || [],
          work_experience: typeof profileData.work_experience === 'string'
            ? JSON.parse(profileData.work_experience)
            : profileData.work_experience || [],
          projects: typeof profileData.projects === 'string'
            ? JSON.parse(profileData.projects)
            : profileData.projects || [],
          certifications: typeof profileData.certifications === 'string'
            ? JSON.parse(profileData.certifications)
            : profileData.certifications || [],
          achievements: typeof profileData.achievements === 'string'
            ? JSON.parse(profileData.achievements)
            : profileData.achievements || [],
          languages: typeof profileData.languages === 'string'
            ? JSON.parse(profileData.languages)
            : profileData.languages || [],
          hobbies: typeof profileData.hobbies === 'string'
            ? JSON.parse(profileData.hobbies)
            : profileData.hobbies || [],
          resume_references: typeof profileData.resume_references === 'string'
            ? JSON.parse(profileData.resume_references)
            : profileData.resume_references || [],
        };
        setProfile(parsedProfile);
        // Generate preview HTML for each template
        templates.forEach(template => {
          template.previewHtml = template.generate(parsedProfile, user.branch);
        });
      } catch (error) {
        console.error('Fetch profile error:', error);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.id]);

  const handleViewResume = (template) => {
    if (!profile || !profile.personal_details.full_name) {
      Alert.alert('Error', 'Please complete your profile before generating a resume.');
      return;
    }
    setPreviewType(template.id);
    setResumeHtml(template.generate(profile, user.branch));
    setPreviewModalVisible(true);
  };

  const handleDownload = async () => {
    if (!resumeHtml) return;
    try {
      const fullName = profile.personal_details.full_name?.trim() || 'User';
      const sanitizedFullName = fullName.replace(/[^a-zA-Z0-9_]/g, '_');
      const fileName = `${sanitizedFullName}_resume.pdf`;

      const { uri } = await Print.printToFileAsync({
        html: resumeHtml,
        base64: false,
        width: A4_WIDTH,
        height: A4_HEIGHT,
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
      });

      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      await Sharing.shareAsync(newPath, {
        dialogTitle: `Save ${fileName}`,
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
      });
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to generate or share PDF');
    }
  };

  const renderTemplateItem = ({ item }) => {
    const cardWidth = width - 30;

    return (
      <TouchableOpacity 
        style={[styles.templateCard, { width: cardWidth }]}
        onPress={() => handleViewResume(item)}
        activeOpacity={0.9}
      >
        <View style={styles.templateHeader}>
          <Ionicons name={item.icon} size={22} color="#4F46E5" />
          <Text style={styles.templateName}>{item.name}</Text>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: item.previewHtml }}
          style={[styles.preview, { height: item.previewHeight }]}
          scalesPageToFit={true}
          enableZoom={false}
          scrollEnabled={false}
        />
        <View style={styles.previewButton}>
          <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
          <Text style={styles.previewButtonText}>Preview Resume</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6B7280" />
        <Text style={styles.loaderText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <Text style={styles.headerText}>Generate Your Resume</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(600).delay(400)}>
        <FlatList
          data={templates}
          renderItem={renderTemplateItem}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 180 }]}
          ListFooterComponent={null}
        />
      </Animated.View>

      <Modal
        visible={previewModalVisible}
        animationType="slide"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Resume Preview</Text>
            <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </Animated.View>
          <WebView
            originWhitelist={['*']}
            source={{ html: resumeHtml }}
            style={styles.fullPreview}
            scalesPageToFit={true}
            enableZoom={true}
            scrollEnabled={false}
          />
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
          >
            <Ionicons name="download-outline" size={20} color="#F9FAFB" style={styles.downloadIcon} />
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 40,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 120,
  },
  header: {
    backgroundColor: '#F3F4F6',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F46E5',
  },

  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 10,
  },
  preview: {
    width: '100%',
    borderRadius: 0,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  previewButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  fullPreview: {
    flex: 1,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#6B7280',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 15,
  },
  downloadIcon: {
    marginRight: 8,
  },
  downloadButtonText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '500',
  },
});