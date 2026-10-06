'use strict';
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType,
  convertInchesToTwip, LineRuleType,
} = require('docx');
const fs   = require('fs');
const path = require('path');

const FONT='Times New Roman'; const CODE_FONT='Courier New';
const SZ_BODY=24; const SZ_H1=28; const SZ_H2=26;
const SZ_CODE=20; const LINE_DBL=480; const LINE_SGL=240;
const AFTER_180=180; const AFTER_120=120; const AFTER_80=80;

function body(text,opts={}){
  return new Paragraph({children:[new TextRun({text,font:FONT,size:SZ_BODY,bold:opts.bold||false,italics:opts.italic||false})],
    alignment:AlignmentType.JUSTIFIED,
    spacing:{line:LINE_DBL,lineRule:LineRuleType.AUTO,after:AFTER_180},
    indent:opts.noIndent?{}:{firstLine:convertInchesToTwip(0.5)}});
}
function bni(t,o={}){return body(t,{...o,noIndent:true});}
function h1(text){return new Paragraph({children:[new TextRun({text,font:FONT,size:SZ_H1,bold:true})],
  alignment:AlignmentType.CENTER,spacing:{before:480,after:320,line:LINE_DBL,lineRule:LineRuleType.AUTO},pageBreakBefore:true});}
function h2(text){return new Paragraph({children:[new TextRun({text,font:FONT,size:SZ_H2,bold:true})],
  alignment:AlignmentType.LEFT,spacing:{before:360,after:AFTER_180,line:LINE_DBL,lineRule:LineRuleType.AUTO}});}
function h3(text){return new Paragraph({children:[new TextRun({text,font:FONT,size:SZ_BODY,bold:true,italics:true})],
  alignment:AlignmentType.LEFT,spacing:{before:280,after:AFTER_120,line:LINE_DBL,lineRule:LineRuleType.AUTO}});}
function appxTitle(text){return new Paragraph({children:[new TextRun({text,font:FONT,size:SZ_H1,bold:true})],
  alignment:AlignmentType.CENTER,spacing:{before:480,after:320,line:LINE_DBL,lineRule:LineRuleType.AUTO},pageBreakBefore:true});}
function appxH2(text){return new Paragraph({children:[new TextRun({text,font:FONT,size:SZ_H2,bold:true})],
  alignment:AlignmentType.LEFT,spacing:{before:320,after:AFTER_180,line:LINE_DBL,lineRule:LineRuleType.AUTO}});}
function appxH3(text){return new Paragraph({children:[new TextRun({text,font:FONT,size:SZ_BODY,bold:true})],
  alignment:AlignmentType.LEFT,spacing:{before:240,after:AFTER_120,line:LINE_DBL,lineRule:LineRuleType.AUTO}});}
function srcLabel(text){return new Paragraph({children:[new TextRun({text,font:FONT,size:SZ_BODY,italics:true})],
  alignment:AlignmentType.LEFT,spacing:{before:AFTER_120,after:AFTER_80,line:LINE_SGL}});}
function code(lines){const text=Array.isArray(lines)?lines.join('\n'):lines;
  return new Paragraph({children:[new TextRun({text,font:CODE_FONT,size:SZ_CODE})],
    alignment:AlignmentType.LEFT,spacing:{line:LINE_SGL,lineRule:LineRuleType.AUTO,before:AFTER_80,after:AFTER_180},
    indent:{left:convertInchesToTwip(0.4)},shading:{type:ShadingType.CLEAR,fill:'F2F2F2'},
    border:{top:{style:BorderStyle.SINGLE,size:4,color:'CCCCCC'},bottom:{style:BorderStyle.SINGLE,size:4,color:'CCCCCC'},
            left:{style:BorderStyle.SINGLE,size:4,color:'CCCCCC'},right:{style:BorderStyle.SINGLE,size:4,color:'CCCCCC'}}});}
function cap(text){return new Paragraph({children:[new TextRun({text,font:FONT,size:SZ_BODY,italics:true})],
  alignment:AlignmentType.CENTER,spacing:{before:AFTER_80,after:AFTER_180,line:LINE_SGL}});}
function ss(label){return new Paragraph({children:[new TextRun({text:`[SCREENSHOT: ${label}]`,font:FONT,size:SZ_BODY,bold:true,color:'555555'})],
  alignment:AlignmentType.CENTER,spacing:{before:AFTER_180,after:AFTER_80,line:LINE_SGL},
  border:{top:{style:BorderStyle.SINGLE,size:6,color:'AAAAAA'},bottom:{style:BorderStyle.SINGLE,size:6,color:'AAAAAA'},
          left:{style:BorderStyle.SINGLE,size:6,color:'AAAAAA'},right:{style:BorderStyle.SINGLE,size:6,color:'AAAAAA'}}});}
function sp(){return new Paragraph({children:[new TextRun('')],spacing:{line:LINE_SGL,after:0}});}
function bul(text){return new Paragraph({children:[new TextRun({text:`\u2022  ${text}`,font:FONT,size:SZ_BODY})],
  alignment:AlignmentType.JUSTIFIED,spacing:{line:LINE_DBL,lineRule:LineRuleType.AUTO,after:AFTER_80},
  indent:{left:convertInchesToTwip(0.5),hanging:convertInchesToTwip(0.25)}});}
function step(n,b,r){return new Paragraph({children:[
  new TextRun({text:`${n}. ${b}: `,font:FONT,size:SZ_BODY,bold:true}),
  new TextRun({text:r,font:FONT,size:SZ_BODY})],
  alignment:AlignmentType.JUSTIFIED,spacing:{line:LINE_DBL,lineRule:LineRuleType.AUTO,after:AFTER_120}});}
function ref(n,text){return new Paragraph({children:[new TextRun({text:`${n}. ${text}`,font:FONT,size:SZ_BODY})],
  alignment:AlignmentType.JUSTIFIED,spacing:{line:LINE_DBL,lineRule:LineRuleType.AUTO,after:AFTER_120},
  indent:{left:convertInchesToTwip(0.5),hanging:convertInchesToTwip(0.5)}});}
function tbl(headers,rows){
  const hcells=headers.map(h=>new TableCell({children:[new Paragraph({
    children:[new TextRun({text:h,font:FONT,size:SZ_BODY,bold:true})],
    alignment:AlignmentType.CENTER,spacing:{after:0}})],
    shading:{type:ShadingType.CLEAR,fill:'D9D9D9'}}));
  const drows=rows.map(row=>new TableRow({children:row.map(cell=>new TableCell({
    children:[new Paragraph({children:[new TextRun({text:String(cell),font:FONT,size:SZ_BODY})],
      alignment:AlignmentType.LEFT,spacing:{after:0}})]}))}));
  return new Table({width:{size:100,type:WidthType.PERCENTAGE},
    rows:[new TableRow({children:hcells,tableHeader:true}),...drows]});}

const C=[];
// CHAPTER THREE
C.push(h1('CHAPTER THREE'));
C.push(new Paragraph({children:[new TextRun({text:'SYSTEMS ANALYSIS AND DESIGN',font:FONT,size:SZ_H1,bold:true})],alignment:AlignmentType.CENTER,spacing:{after:320,line:LINE_DBL,lineRule:LineRuleType.AUTO}}));
C.push(h2('3.1 Analysis of the Existing System'));
C.push(body('Prior to the development of the proposed web-based student ID card validation system, the predominant approach to identity verification in most Nigerian tertiary institutions relied almost entirely on manual, paper-based mechanisms. Security personnel, library attendants, and examination invigilators were charged with physically inspecting laminated identity cards presented by students at various access points. This section provides a systematic examination of how this existing process operated, the structural limitations inherent in its design, and the circumstances that collectively motivated the need for a digital alternative.'));
C.push(h3('3.1.1 How the Existing System Operated'));
C.push(body('Under the existing system, each student was issued a laminated plastic identity card at the point of registration. The card typically bore the student\'s full name, passport photograph, matric number, department, faculty, and an institutional logo. At entry points such as the library gate, examination halls, and the main campus gate, security personnel examined cards visually, comparing the photograph on the card to the face of the presenting student and verifying that the card bore institutional branding.'));
C.push(body('Administrative updates such as suspensions, graduations, or withdrawals were propagated through a combination of printed circulars, email bulletins, and verbal briefings between the registrar\'s office and the security department. In practice, this communication chain was slow and unreliable. Security officers at campus checkpoints frequently had no means of knowing, in real time, whether a student presenting a physically authentic card was still actively enrolled.'));
C.push(body('The manual verification procedure imposed no time limit on the inspection process, yet in practice the large volumes of students presenting simultaneously during examination periods and morning peak hours forced inspectors to conduct extremely brief examinations. Under these conditions, the inspection was reduced in many observed instances to a cursory glance at the card followed by a wave-through, which effectively negated the security value of the inspection process altogether.'));
C.push(h3('3.1.2 Deficiencies of the Existing System'));
C.push(body('The first and most critical deficiency of the existing system was its susceptibility to forgery. Laminated identity cards could be reproduced using widely available inkjet printers, lamination pouches, and PVC card cutters. The visual elements that were intended to confer authenticity could all be replicated by anyone with access to a sample card and basic desktop publishing software. There was no digital signature, no machine-readable cryptographic element, and no shared secret between the card and the institution\'s database that could distinguish a genuine card from a convincing forgery.'));
C.push(body('The second major deficiency was the complete absence of real-time enrollment status verification. Once a card was issued to a student, it remained physically valid until it expired or was physically confiscated. If a student\'s enrollment was terminated there was no mechanism to immediately render the existing card invalid. The student could continue to present the card at access points, and security personnel, lacking access to any live database, had no way to detect the discrepancy.'));
C.push(body('The third deficiency was the total lack of an audit trail. Each time a student presented their card at an entry point, no record was created of the transaction. It was therefore impossible to reconstruct a history of access events for a specific student, to quantify total student traffic at a checkpoint on a given day, or to investigate access-related security incidents retroactively.'));
C.push(body('The fourth deficiency related to operational load and human error. During high-traffic periods, security staff were placed under considerable cognitive pressure. The combination of time pressure and the subtle visual similarity between genuine and counterfeit cards created conditions highly conducive to errors of inspection. Staff fatigue compounded this problem over long examination sessions.'));
C.push(body('The fifth deficiency concerned the token revocation problem. There was no mechanism for immediately revoking the validity of a stolen or lost card. The process of replacing a lost card typically involved a multi-day administrative procedure, during which the lost card itself remained physically valid and could be exploited by the finder.'));
C.push(body('The sixth deficiency concerned reporting and metrics. There was no structured mechanism for tracking how many verifications occurred at each checkpoint. The registrar\'s office could not report on access metrics, security workload distribution, or the relative frequency of verification events at different points. This absence of data made it difficult to plan staffing levels or to justify resource allocation to security operations.'));
C.push(sp()); 
C.push(tbl(['S/N','Problem Area','Specific Deficiency','Impact'],
[['1','Card authenticity','No cryptographic or machine-readable verification','High susceptibility to forgery and impersonation'],
 ['2','Enrollment status','No real-time link to student database','Expelled students retain physical access'],
 ['3','Audit trail','No record of scan or verification events','Inability to investigate security incidents'],
 ['4','Token revocation','Lost cards remain valid indefinitely','Ongoing security risk from stolen cards'],
 ['5','Operational efficiency','Manual inspection under high-volume conditions','Increased error rate and queue congestion'],
 ['6','Data integration','Security staff have no access to live enrollment data','Data silos between registrar and security'],
 ['7','Reporting and metrics','No quantitative data on access events','Inability to support evidence-based security planning'],
 ['8','Replacement process','Multi-day administrative replacement procedure','Legitimate students denied access for extended periods']]));
C.push(cap('Table 3.1: Summary of Deficiencies in the Existing ID Verification System'));
