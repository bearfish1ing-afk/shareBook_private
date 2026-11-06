package com.shareBook.book.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectAclRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket}")
    private String bucket;

    //프로필 이미지
    public String uploadProfileImage(MultipartFile file) throws IOException{
        String ext= StringUtils.getFilenameExtension(file.getOriginalFilename());
        String key = "profile/" + UUID.randomUUID() + "."+ext;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)//어느 버킷
                .key(key)//어떤 이름
                .contentType(file.getContentType())//image/jpeg, image/png 등 어떤 종류의 파일로
                .build();

        //실제 전송 request를 보냄
        s3Client.putObject(
                request,
                RequestBody.fromBytes(file.getBytes())
        );

        return key;
    }

    //memo 이미지 업로드
    public String uploadMemoImage(MultipartFile file) throws IOException{
        String ext=StringUtils.getFilenameExtension(file.getOriginalFilename());
        String key="Memo/"+UUID.randomUUID()+"."+ext;

        PutObjectRequest request=PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(
                request,
                RequestBody.fromBytes(file.getBytes())
        );

        return key;
    }

    //memo 이미지 삭제
    public void deleteFile(String key){
        if(key==null || key.isBlank()){
            return;
        }

        DeleteObjectRequest request= DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        s3Client.deleteObject(request);
    }

    //epub(책 파일) 업로드
    public String upload(MultipartFile file) throws IOException{
        String key = "epub/" + UUID.randomUUID() + ".epub";

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType("application/epub+zip")
                .build();

        s3Client.putObject(
                request,
                RequestBody.fromBytes(file.getBytes())
        );

        return key;
    }

    //책 표지 이미지 업로드
    public String uploadCoverImage(MultipartFile file) throws IOException{
        String ext= StringUtils.getFilenameExtension(file.getOriginalFilename());
        String key = "cover/" + UUID.randomUUID() + "."+ext;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)//어느 버킷
                .key(key)//어떤 이름
                .contentType(file.getContentType())//image/jpeg, image/png 등 어떤 종류의 파일로
                .build();

        //실제 전송 request를 보냄
        s3Client.putObject(
                request,
                RequestBody.fromBytes(file.getBytes())
        );

        return key;
    }

    public String getPresignedUrl(String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest =
                GetObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(30))
                        .getObjectRequest(getObjectRequest)
                        .build();

        PresignedGetObjectRequest presignedRequest =
                s3Presigner.presignGetObject(presignRequest);

        return presignedRequest.url().toString();
    }
}
